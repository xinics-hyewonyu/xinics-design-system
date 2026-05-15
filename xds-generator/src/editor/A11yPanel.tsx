/**
 * UI Spec §4.5 — 우하 접근성 점검 패널 (본격 버전, Sprint 1C T-018).
 *
 * 책임:
 * - 64항목 자동 검증 결과를 카테고리별로 표시 (Accessibility Spec §3·§10).
 * - 미달 항목의 사유를 토큰 경로 단위로 노출.
 * - 자동 보정 가능 항목은 [보정] 버튼 — 클릭 시 Seed 패치 적용.
 * - "한 번에 보정" 버튼 — 모든 자동 보정 가능 미달을 동시 적용.
 *
 * 검증 흐름:
 * - tree 변경 시 250ms 디바운스 후 runAllChecks 실행
 * - axe-core는 previewRef.current에 대해 실행 (Surface B)
 * - 자체 룰은 TokenTree만으로 동기 실행
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, ChevronDown, ChevronRight, Copy, ExternalLink, Info, Loader2, Maximize2, Minimize2, Wand2 } from "lucide-react";
import {
  mergeAutoFixes,
  runAllChecks,
  type AxeNodeDetail,
  type CheckResult,
  type CheckStatus,
  type SeedPatch,
} from "../a11y/engine";
import {
  CATEGORY_LABEL,
  type Category,
} from "../a11y/criteria";
import { useProjectStore } from "../store/projectStore";
import type { SeedTokens, TokenTree } from "../tokens/types";

interface Props {
  tree: TokenTree;
  projectId: string;
  previewRef: RefObject<HTMLDivElement>;
}

type Filter = "fails" | "all";

const CATEGORY_ORDER: readonly Category[] = [
  "perceivable",
  "operable",
  "understandable",
  "robust",
  "korean",
];

export function A11yPanel({ tree, projectId, previewRef }: Props) {
  const updateSeed = useProjectStore((s) => s.updateSeed);
  const updateSeedColor = useProjectStore((s) => s.updateSeedColor);
  const recordAutoFix = useProjectStore((s) => s.recordAutoFix);

  const [results, setResults] = useState<CheckResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<Filter>("fails");
  const [openCategories, setOpenCategories] = useState<Set<Category>>(
    () => new Set(["perceivable", "operable", "korean"]),
  );
  /** 노드 목록(위반 요소 N건)이 펼쳐진 criterion ID들. */
  const [openNodeLists, setOpenNodeLists] = useState<Set<string>>(() => new Set());
  /** 사용자가 카테고리를 명시적으로 토글했는지 추적 — true면 자동 폴딩이 그 카테고리를 건드리지 않음. */
  const userTouchedCategoriesRef = useRef<Set<Category>>(new Set());
  const cancelRef = useRef(0);

  useEffect(() => {
    const generation = ++cancelRef.current;
    setScanning(true);
    const timer = window.setTimeout(async () => {
      const next = await runAllChecks(tree, { root: previewRef.current ?? undefined });
      if (cancelRef.current === generation) {
        setResults(next);
        setScanning(false);
        // 자동 폴딩: fail/warn 0건인 카테고리는 접고, 1건 이상이면 펼친다.
        // 단 사용자가 직접 토글한 카테고리는 그대로 둔다.
        const failsByCat = new Map<Category, number>();
        for (const r of next) {
          if (r.status === "fail" || r.status === "warn") {
            failsByCat.set(r.criterion.category, (failsByCat.get(r.criterion.category) ?? 0) + 1);
          }
        }
        setOpenCategories((prev) => {
          const adjusted = new Set(prev);
          for (const cat of CATEGORY_ORDER) {
            if (userTouchedCategoriesRef.current.has(cat)) continue;
            const hasFail = (failsByCat.get(cat) ?? 0) > 0;
            if (hasFail) adjusted.add(cat);
            else adjusted.delete(cat);
          }
          return adjusted;
        });
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [tree, previewRef]);

  const applyPatch = useCallback(
    (patch: SeedPatch) => {
      if (patch.color) {
        for (const [key, value] of Object.entries(patch.color)) {
          if (typeof value === "string") {
            updateSeedColor(projectId, key as keyof SeedTokens["color"], value);
          }
        }
      }
      const { color: _color, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        updateSeed(projectId, rest);
      }
    },
    [projectId, updateSeed, updateSeedColor],
  );

  /** 단일 fix 적용 + audit 기록. */
  const applyOneFix = useCallback(
    (criterionId: string, description: string, patch: SeedPatch) => {
      applyPatch(patch);
      recordAutoFix(projectId, {
        criterionId,
        description,
        appliedAt: new Date().toISOString(),
      });
    },
    [applyPatch, projectId, recordAutoFix],
  );

  /** 한 번에 보정 — merged patch 한 번에 + 항목별 audit 기록. */
  const applyAllFixes = useCallback(
    (fails: readonly CheckResult[]) => {
      const merged = mergeAutoFixes(fails);
      if (merged) applyPatch(merged);
      const at = new Date().toISOString();
      for (const f of fails) {
        if (f.fix?.description && hasUsefulFix(f)) {
          recordAutoFix(projectId, {
            criterionId: f.criterionId,
            description: f.fix.description,
            appliedAt: at,
          });
        }
      }
    },
    [applyPatch, projectId, recordAutoFix],
  );

  const counts = useMemo(() => bucketByStatus(results), [results]);
  const fixableFails = useMemo(
    () => results.filter((r) => r.status === "fail" && hasUsefulFix(r)),
    [results],
  );
  const batchFix = useMemo(() => mergeAutoFixes(results), [results]);
  const batchFixUseful = batchFix && Object.keys(batchFix).length > 0;

  const visible = useMemo(
    () => (filter === "fails" ? results.filter((r) => r.status === "fail" || r.status === "warn") : results),
    [results, filter],
  );

  const grouped = useMemo(() => groupByCategory(visible), [visible]);

  const toggleCategory = (cat: Category) => {
    userTouchedCategoriesRef.current.add(cat);
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleNodeList = useCallback((criterionId: string) => {
    setOpenNodeLists((prev) => {
      const next = new Set(prev);
      if (next.has(criterionId)) next.delete(criterionId);
      else next.add(criterionId);
      return next;
    });
  }, []);

  /** 모든 카테고리 + 노드가 있는 모든 항목의 노드 목록을 펼친다. */
  const expandAll = useCallback(() => {
    for (const cat of CATEGORY_ORDER) userTouchedCategoriesRef.current.add(cat);
    setOpenCategories(new Set<Category>(CATEGORY_ORDER));
    setOpenNodeLists(
      new Set(results.filter((r) => (r.nodes?.length ?? 0) > 0).map((r) => r.criterionId)),
    );
  }, [results]);

  /** 모든 카테고리 + 노드 disclosure 접기. */
  const collapseAll = useCallback(() => {
    for (const cat of CATEGORY_ORDER) userTouchedCategoriesRef.current.add(cat);
    setOpenCategories(new Set());
    setOpenNodeLists(new Set());
  }, []);

  return (
    <section
      className="h-full flex flex-col"
      aria-label="접근성 점검"
      style={{
        background: "var(--xds-tool-surface)",
        borderLeft: "1px solid var(--xds-tool-border)",
      }}
    >
      {/* Header — 통과/미달 카운트 + 디바운스 상태 */}
      <header
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--xds-tool-border)" }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--xds-tool-text-muted)" }}>
            접근성 점검
          </h2>
          {scanning && (
            <Loader2
              className="size-3.5 animate-spin"
              style={{ color: "var(--xds-tool-text-muted)" }}
              aria-label="검사 중"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tabular-nums" aria-live="polite">
            <span style={{ color: "var(--xds-tool-success)" }}>{counts.pass}</span>
            <span style={{ color: "var(--xds-tool-text-muted)" }}> / </span>
            <span>{results.length}</span>
          </span>
          <Link
            to={`/projects/${projectId}/a11y-report`}
            className="inline-flex items-center gap-1 text-[11px] font-medium"
            style={{ color: "var(--xds-tool-text-muted)" }}
            aria-label="접근성 리포트 풀스크린 열기"
            title="64항목 전체 카드 뷰"
          >
            상세
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        </div>
      </header>

      {/* 한 번에 보정 + 필터 토글 */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--xds-tool-border)" }}
      >
        <button
          type="button"
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: batchFixUseful ? "var(--xds-tool-primary)" : "var(--xds-tool-elevated)",
            color: batchFixUseful ? "var(--xds-tool-primary-fg)" : "var(--xds-tool-text-muted)",
            border: "1px solid var(--xds-tool-border)",
          }}
          disabled={!batchFixUseful}
          onClick={() => applyAllFixes(fixableFails)}
          aria-label="모든 자동 보정 가능 미달을 한 번에 적용"
        >
          <Wand2 className="size-3.5" aria-hidden />
          한 번에 보정
          {fixableFails.length > 0 && (
            <span className="font-mono tabular-nums">({fixableFails.length})</span>
          )}
        </button>
        <button
          type="button"
          className="p-1 rounded"
          style={{ color: "var(--xds-tool-text-muted)", border: "1px solid var(--xds-tool-border)" }}
          onClick={expandAll}
          title="모두 펼치기"
          aria-label="모든 카테고리와 위반 요소 목록 펼치기"
        >
          <Maximize2 className="size-3" aria-hidden />
        </button>
        <button
          type="button"
          className="p-1 rounded"
          style={{ color: "var(--xds-tool-text-muted)", border: "1px solid var(--xds-tool-border)" }}
          onClick={collapseAll}
          title="모두 접기"
          aria-label="모든 카테고리와 위반 요소 목록 접기"
        >
          <Minimize2 className="size-3" aria-hidden />
        </button>
        <FilterTabs value={filter} onChange={setFilter} />
      </div>

      {/* 결과 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {results.length === 0 && !scanning && (
          <p className="text-xs text-center mt-6" style={{ color: "var(--xds-tool-text-muted)" }}>
            아직 검사 결과가 없습니다.
          </p>
        )}
        {results.length > 0 && filter === "fails" && counts.fail + counts.warn === 0 && (
          <p
            className="text-xs text-center mt-6 inline-flex items-center justify-center gap-1.5 w-full"
            style={{ color: "var(--xds-tool-success)" }}
          >
            <Check className="size-3.5" aria-hidden />
            모든 자동 검증 항목이 통과했습니다.
          </p>
        )}
        {CATEGORY_ORDER.map((cat) => {
          const list = grouped.get(cat) ?? [];
          if (list.length === 0) return null;
          const isOpen = openCategories.has(cat);
          const catCounts = bucketByStatus(list);
          return (
            <section key={cat}>
              <button
                type="button"
                className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded transition-colors"
                style={{
                  background: "var(--xds-tool-elevated)",
                  border: "1px solid var(--xds-tool-border)",
                }}
                onClick={() => toggleCategory(cat)}
                aria-expanded={isOpen}
              >
                <span className="inline-flex items-center gap-1.5 font-medium">
                  {isOpen ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
                  {CATEGORY_LABEL[cat]}
                </span>
                <span className="font-mono tabular-nums" style={{ color: "var(--xds-tool-text-muted)" }}>
                  {catCounts.fail > 0 && (
                    <span style={{ color: "var(--xds-tool-danger)" }}>{catCounts.fail} ✕</span>
                  )}
                  {catCounts.warn > 0 && (
                    <span style={{ color: "var(--xds-tool-warning)" }}> {catCounts.warn} ⚠</span>
                  )}
                  <span> {catCounts.pass} ✓</span>
                </span>
              </button>
              {isOpen && (
                <ul className="mt-1.5 space-y-1.5">
                  {list.map((r) => (
                    <CheckItem
                      key={r.criterionId}
                      result={r}
                      nodesOpen={openNodeLists.has(r.criterionId)}
                      onToggleNodes={() => toggleNodeList(r.criterionId)}
                      onApplyFix={() =>
                        r.fix &&
                        applyOneFix(r.criterionId, r.fix.description, r.fix.patch)
                      }
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Footer — 매뉴얼 항목 안내 */}
      <footer
        className="px-3 py-2 text-[10px] flex items-center gap-1.5"
        style={{
          borderTop: "1px solid var(--xds-tool-border)",
          color: "var(--xds-tool-text-muted)",
        }}
      >
        <Info className="size-3" aria-hidden />
        manual 표시는 수동 검토 필요 항목입니다 (자막·스크린리더 등).
      </footer>
    </section>
  );
}

function CheckItem({
  result,
  nodesOpen,
  onToggleNodes,
  onApplyFix,
}: {
  result: CheckResult;
  nodesOpen: boolean;
  onToggleNodes: () => void;
  onApplyFix: () => void;
}) {
  const { status, criterion } = result;
  const palette = STATUS_PALETTE[status];
  const fixUseful = hasUsefulFix(result);
  const nodeCount = result.nodes?.length ?? 0;
  return (
    <li
      className="p-2 rounded"
      style={{
        background: "var(--xds-tool-elevated)",
        border: `1px solid ${palette.border}`,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5" aria-hidden style={{ color: palette.icon }}>
          <StatusIcon status={status} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium leading-tight">
              <span className="font-mono mr-1.5" style={{ color: "var(--xds-tool-text-muted)" }}>
                {criterion.id}
              </span>
              {criterion.title}
            </span>
            <span className="text-[10px] font-mono tabular-nums shrink-0" style={{ color: palette.label }}>
              {result.actual}
            </span>
          </div>
          <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--xds-tool-text-muted)" }}>
            {result.message}
          </p>
          {result.detail && (
            <p
              className="text-[10px] mt-0.5 leading-snug font-mono break-all"
              style={{ color: "var(--xds-tool-text-muted)", opacity: 0.7 }}
            >
              {result.detail}
            </p>
          )}
          {nodeCount > 0 && (
            <>
              <div className="flex items-center justify-between mt-1 gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] font-medium"
                  style={{ color: "var(--xds-tool-text-muted)" }}
                  onClick={onToggleNodes}
                  aria-expanded={nodesOpen}
                  aria-label={`위반 요소 ${nodeCount}건 ${nodesOpen ? "접기" : "펼치기"}`}
                >
                  {nodesOpen ? <ChevronDown className="size-3" aria-hidden /> : <ChevronRight className="size-3" aria-hidden />}
                  위반 요소 {nodeCount}건 {nodesOpen ? "접기" : "보기"}
                </button>
                <CopyButton
                  label="전체 복사"
                  text={formatNodesForCopy(criterion.id, result.nodes!)}
                />
              </div>
              {nodesOpen && (
                <ul className="mt-1 space-y-1">
                  {result.nodes!.map((n, i) => (
                    <NodeRow key={`${n.target}-${i}`} node={n} />
                  ))}
                </ul>
              )}
            </>
          )}
          {result.fix && fixUseful && (
            <button
              type="button"
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: "var(--xds-tool-primary)",
                color: "var(--xds-tool-primary-fg)",
              }}
              onClick={onApplyFix}
              aria-label={`${criterion.id} 자동 보정 적용`}
            >
              <Wand2 className="size-3" aria-hidden />
              보정 적용
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function NodeRow({ node }: { node: AxeNodeDetail }) {
  return (
    <li
      className="px-1.5 py-1 rounded text-[10px] leading-snug"
      style={{
        background: "var(--xds-tool-surface)",
        border: "1px solid var(--xds-tool-border)",
      }}
    >
      <div className="flex items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="font-mono break-all" style={{ color: "var(--xds-tool-text)" }}>
            {node.target}
          </div>
          {node.contrast && (
            <div
              className="font-mono tabular-nums mt-0.5"
              style={{ color: "var(--xds-tool-danger)" }}
            >
              {node.contrast.ratio.toFixed(2)}:1
              <span style={{ color: "var(--xds-tool-text-muted)" }}>
                {" "}(요구 {node.contrast.expected}:1)
              </span>
              <span className="ml-1.5" style={{ color: "var(--xds-tool-text-muted)" }}>
                {node.contrast.fg} on {node.contrast.bg}
              </span>
            </div>
          )}
          {node.htmlSnippet && (
            <div
              className="font-mono mt-0.5 break-all"
              style={{ color: "var(--xds-tool-text-muted)", opacity: 0.7 }}
            >
              {node.htmlSnippet}
            </div>
          )}
        </div>
        <CopyButton compact text={formatSingleNodeForCopy(node)} />
      </div>
    </li>
  );
}

function CopyButton({
  text,
  label = "복사",
  compact = false,
}: {
  text: string;
  label?: string;
  compact?: boolean;
}) {
  const [done, setDone] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1200);
    } catch {
      // 클립보드 거부 — 무시.
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        compact
          ? "shrink-0 p-0.5 rounded"
          : "shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
      }
      style={{
        color: done ? "var(--xds-tool-success)" : "var(--xds-tool-text-muted)",
        border: "1px solid var(--xds-tool-border)",
      }}
      aria-label={done ? "복사됨" : label}
      title={done ? "복사됨" : label}
    >
      {done ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      {!compact && <span>{done ? "복사됨" : label}</span>}
    </button>
  );
}

function formatSingleNodeForCopy(node: AxeNodeDetail): string {
  const lines: string[] = [node.target];
  if (node.contrast) {
    lines.push(
      `  ${node.contrast.ratio.toFixed(2)}:1 (요구 ${node.contrast.expected}:1) ` +
        `${node.contrast.fg} on ${node.contrast.bg}`,
    );
  }
  if (node.htmlSnippet) lines.push(`  ${node.htmlSnippet}`);
  if (node.failureSummary) lines.push(`  ${node.failureSummary}`);
  return lines.join("\n");
}

function formatNodesForCopy(criterionId: string, nodes: readonly AxeNodeDetail[]): string {
  const header = `[${criterionId}] 위반 요소 ${nodes.length}건`;
  const body = nodes.map(formatSingleNodeForCopy).join("\n\n");
  return `${header}\n\n${body}`;
}

function FilterTabs({ value, onChange }: { value: Filter; onChange: (v: Filter) => void }) {
  return (
    <div
      className="inline-flex rounded overflow-hidden text-[10px]"
      style={{ border: "1px solid var(--xds-tool-border)" }}
      role="tablist"
      aria-label="결과 필터"
    >
      {(["fails", "all"] as const).map((v) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className="px-2 py-1 font-medium"
            style={{
              background: active ? "var(--xds-tool-elevated)" : "transparent",
              color: active ? "var(--xds-tool-text)" : "var(--xds-tool-text-muted)",
            }}
          >
            {v === "fails" ? "미달" : "전체"}
          </button>
        );
      })}
    </div>
  );
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <Check className="size-3.5" />;
  if (status === "fail") return <AlertTriangle className="size-3.5" />;
  if (status === "warn") return <AlertTriangle className="size-3.5" />;
  return <Info className="size-3.5" />;
}

const STATUS_PALETTE: Record<
  CheckStatus,
  { border: string; icon: string; label: string }
> = {
  pass: {
    border: "var(--xds-tool-border)",
    icon: "var(--xds-tool-success)",
    label: "var(--xds-tool-success)",
  },
  fail: {
    border: "var(--xds-tool-danger)",
    icon: "var(--xds-tool-danger)",
    label: "var(--xds-tool-danger)",
  },
  warn: {
    border: "var(--xds-tool-warning)",
    icon: "var(--xds-tool-warning)",
    label: "var(--xds-tool-warning)",
  },
  manual: {
    border: "var(--xds-tool-border)",
    icon: "var(--xds-tool-text-muted)",
    label: "var(--xds-tool-text-muted)",
  },
};

function bucketByStatus(
  list: readonly CheckResult[],
): Record<CheckStatus, number> {
  const out: Record<CheckStatus, number> = { pass: 0, fail: 0, warn: 0, manual: 0 };
  for (const r of list) out[r.status] += 1;
  return out;
}

function groupByCategory(list: readonly CheckResult[]): Map<Category, CheckResult[]> {
  const map = new Map<Category, CheckResult[]>();
  for (const r of list) {
    const arr = map.get(r.criterion.category) ?? [];
    arr.push(r);
    map.set(r.criterion.category, arr);
  }
  return map;
}

/** 빈 patch는 보정 버튼을 노출해도 의미 없으므로 필터. */
function hasUsefulFix(r: CheckResult): boolean {
  if (!r.fix) return false;
  const p = r.fix.patch;
  return (
    Boolean(p.color && Object.keys(p.color).length > 0) ||
    p.fontSize !== undefined ||
    p.borderRadius !== undefined ||
    p.fontFamily !== undefined ||
    p.spacingBase !== undefined ||
    p.density !== undefined ||
    p.wireframe !== undefined ||
    p.focusRingColorStep !== undefined ||
    p.actionPrimaryStep !== undefined ||
    p.actionDangerStep !== undefined
  );
}
