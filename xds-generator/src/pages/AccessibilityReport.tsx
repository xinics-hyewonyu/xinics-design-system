/**
 * 접근성 리포트 풀스크린 — UI Spec §6.
 *
 * 64항목을 카테고리별 카드 그리드로 표시 (Accessibility Spec §3·§10.1).
 * - 상단 요약: WCAG 2.2 AA / KWCAG 2.2 통과 여부 + 통계
 * - 카테고리별 카드: 각 항목의 상태·실측·메시지·자동 보정 제안
 * - 적용 내역 섹션: 마지막 export 이후 적용한 보정
 * - 수동 검토 가이드: 자동 판정 불가 항목 안내
 *
 * 데이터 소스는 A11yPanel과 동일한 runAllChecks. 본 페이지는 read-only 뷰이고
 * 보정은 에디터로 돌아가 적용한다 ([에디터로 돌아가기] 버튼).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertTriangle, Check, ChevronLeft, Info, Loader2 } from "lucide-react";
import { Header } from "../editor/Header";
import {
  runAllChecks,
  type CheckResult,
} from "../a11y/engine";
import {
  CATEGORY_LABEL,
  CRITERIA_BY_CATEGORY,
  type Category,
} from "../a11y/criteria";
import {
  projectToEffectivePreset,
  useProjectStore,
} from "../store/projectStore";
import { generateTokenTree } from "../tokens/build";

const CATEGORY_ORDER: readonly Category[] = [
  "perceivable",
  "operable",
  "understandable",
  "robust",
  "korean",
];

export function AccessibilityReportPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const scanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    setLoading(true);
    const tree = generateTokenTree(projectToEffectivePreset(project));
    // axe는 DOM이 필요하지만 본 페이지에는 프리뷰가 없으므로 self rules만 실행.
    runAllChecks(tree, { root: undefined }).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, [project]);

  const counts = useMemo(() => {
    const out = { pass: 0, fail: 0, warn: 0, manual: 0 };
    for (const r of results) out[r.status] += 1;
    return out;
  }, [results]);

  const grouped = useMemo(() => {
    const map = new Map<Category, CheckResult[]>();
    for (const r of results) {
      const arr = map.get(r.criterion.category) ?? [];
      arr.push(r);
      map.set(r.criterion.category, arr);
    }
    return map;
  }, [results]);

  if (!project) return <Navigate to="/" replace />;

  const overallPass = counts.fail === 0;
  const appliedFixes = project.appliedAutoFixes ?? [];

  return (
    <div className="min-h-screen">
      <Header projectName={project.name} mode="dashboard" />
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 text-xs mb-2"
              style={{ color: "var(--xds-tool-text-muted)" }}
            >
              <ChevronLeft className="size-3" aria-hidden /> 에디터로 돌아가기
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">접근성 리포트</h1>
            <p className="text-sm mt-1" style={{ color: "var(--xds-tool-text-muted)" }}>
              WCAG 2.2 AA + KWCAG 2.2 — Accessibility Spec §3 (64항목)
            </p>
          </div>
        </div>

        {/* 요약 */}
        <section
          className="p-4 rounded-md mb-6"
          style={{
            background: "var(--xds-tool-surface)",
            border: "1px solid var(--xds-tool-border)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            {loading ? (
              <Loader2 className="size-5 animate-spin" style={{ color: "var(--xds-tool-text-muted)" }} aria-hidden />
            ) : overallPass ? (
              <Check className="size-5" style={{ color: "var(--xds-tool-success)" }} aria-hidden />
            ) : (
              <AlertTriangle className="size-5" style={{ color: "var(--xds-tool-danger)" }} aria-hidden />
            )}
            <div>
              <p className="text-sm font-medium">
                {loading
                  ? "검사 중…"
                  : overallPass
                  ? "전체 자동 검증 통과 — Export 가능"
                  : `미달 ${counts.fail}건 — Export 차단`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--xds-tool-text-muted)" }}>
                전체 {results.length}건 · 통과 {counts.pass} · 미달 {counts.fail} · 경고 {counts.warn} · 수동 {counts.manual}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center" ref={scanRef}>
            <SummaryTile label="통과" count={counts.pass} color="var(--xds-tool-success)" />
            <SummaryTile label="미달" count={counts.fail} color="var(--xds-tool-danger)" />
            <SummaryTile label="경고" count={counts.warn} color="var(--xds-tool-warning)" />
            <SummaryTile label="수동" count={counts.manual} color="var(--xds-tool-text-muted)" />
          </div>
        </section>

        {/* 자동 보정 적용 내역 */}
        {appliedFixes.length > 0 ? (
          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-2">자동 보정 적용 내역 (마지막 export 이후)</h2>
            <ul className="space-y-1.5">
              {appliedFixes.map((f, i) => (
                <li
                  key={`${f.criterionId}-${i}`}
                  className="p-2.5 rounded text-xs flex items-start gap-2.5"
                  style={{
                    background: "var(--xds-tool-surface)",
                    border: "1px solid var(--xds-tool-border)",
                  }}
                >
                  <span className="font-mono shrink-0" style={{ color: "var(--xds-tool-text-muted)" }}>
                    {f.criterionId}
                  </span>
                  <span className="flex-1">{f.description}</span>
                  <span className="text-[10px] shrink-0" style={{ color: "var(--xds-tool-text-muted)" }}>
                    {new Date(f.appliedAt).toLocaleTimeString("ko-KR")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 카테고리별 카드 그리드 */}
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat) ?? [];
          const criteriaInCat = CRITERIA_BY_CATEGORY[cat];
          if (criteriaInCat.length === 0) return null;
          return (
            <section key={cat} className="mb-6">
              <h2 className="text-sm font-semibold mb-2">
                {CATEGORY_LABEL[cat]} ({items.length}/{criteriaInCat.length})
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {criteriaInCat.map((c) => {
                  const r = items.find((x) => x.criterionId === c.id);
                  return (
                    <CriterionCard
                      key={c.id}
                      result={r}
                      criterionId={c.id}
                      title={c.title}
                      threshold={c.threshold}
                      verification={c.verification}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* 수동 검토 가이드 */}
        <section
          className="mt-8 p-4 rounded-md text-xs"
          style={{
            background: "var(--xds-tool-surface)",
            border: "1px dashed var(--xds-tool-border)",
            color: "var(--xds-tool-text-muted)",
          }}
        >
          <p className="font-medium mb-1">수동 검토 항목 안내</p>
          <p>
            🟦 표시 항목은 토큰만으로 판정 불가하여 콘텐츠 단계 검토가 필요합니다 — 자막
            메타데이터 부착, 스크린리더(NVDA·VoiceOver) 30분 실측, 헤딩 순서 시각 확인 등.
            v0.3 협업 모드의 리뷰어 라벨링 워크플로우가 추가되면 본 항목들이 체크리스트로
            관리됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}

function SummaryTile({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      className="p-2 rounded"
      style={{
        background: "var(--xds-tool-elevated)",
        border: "1px solid var(--xds-tool-border)",
      }}
    >
      <div className="text-2xl font-mono tabular-nums" style={{ color }}>
        {count}
      </div>
      <div className="text-[10px]" style={{ color: "var(--xds-tool-text-muted)" }}>
        {label}
      </div>
    </div>
  );
}

function CriterionCard({
  result,
  criterionId,
  title,
  threshold,
  verification,
}: {
  result: CheckResult | undefined;
  criterionId: string;
  title: string;
  threshold: string;
  verification: string;
}) {
  const status = result?.status ?? "manual";
  const palette = STATUS_PALETTE[status];
  return (
    <article
      className="p-2.5 rounded text-xs"
      style={{
        background: "var(--xds-tool-surface)",
        border: `1px solid ${palette.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono" style={{ color: "var(--xds-tool-text-muted)" }}>
            {criterionId}
          </span>
          <span className="font-medium">{title}</span>
        </div>
        <span
          className="inline-flex items-center gap-1 shrink-0 text-[10px] font-mono tabular-nums"
          style={{ color: palette.icon }}
        >
          {status === "pass" ? <Check className="size-3" aria-hidden /> : null}
          {status === "fail" ? <AlertTriangle className="size-3" aria-hidden /> : null}
          {status === "warn" ? <AlertTriangle className="size-3" aria-hidden /> : null}
          {status === "manual" ? <Info className="size-3" aria-hidden /> : null}
          {result?.actual ?? "—"}
        </span>
      </div>
      <p className="text-[11px] leading-snug" style={{ color: "var(--xds-tool-text-muted)" }}>
        {result?.message ?? `${threshold} · ${verification === "manual" ? "수동 검토 필요" : "자동 검증 미실행"}`}
      </p>
      {result?.fix?.description ? (
        <p className="text-[11px] mt-1.5" style={{ color: "var(--xds-tool-primary)" }}>
          제안: {result.fix.description}
        </p>
      ) : null}
    </article>
  );
}

const STATUS_PALETTE: Record<
  CheckResult["status"],
  { border: string; icon: string }
> = {
  pass: { border: "var(--xds-tool-border)", icon: "var(--xds-tool-success)" },
  fail: { border: "var(--xds-tool-danger)", icon: "var(--xds-tool-danger)" },
  warn: { border: "var(--xds-tool-warning)", icon: "var(--xds-tool-warning)" },
  manual: { border: "var(--xds-tool-border)", icon: "var(--xds-tool-text-muted)" },
};
