/**
 * Export 마법사 3단계 — UI Spec §5, Accessibility Spec §10.
 *
 * Step 1 (검증): 접근성 self check 결과 표시. 차단(fail+block) 항목이 있으면
 *               [다음]이 비활성화되고 항목별 [보정 적용] CTA가 노출된다.
 * Step 2 (옵션): 어떤 파일 그룹을 포함할지 선택 + 패키지 이름 미리보기.
 * Step 3 (처리): bundleArtifacts 실행 → 다운로드 트리거 → 결과 요약.
 *
 * useExport와 달리 단계별 상태와 옵션을 보존하며, 차단 모달의 역할도 흡수한다.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import {
  mergeAutoFixes,
  runSelfChecks,
  type AxeNodeDetail,
  type CheckResult,
  type SeedPatch,
} from "../a11y/engine";
import { bundleArtifacts, triggerDownload, type BundleResult } from "../output/bundle";
import { useProjectStore, projectToEffectivePreset } from "../store/projectStore";
import { generateTokenTree } from "../tokens/build";
import { GENERATOR_VERSION } from "../version";
import type { ActivityOutput } from "../store/types";
import type { SeedTokens } from "../tokens/types";

interface Props {
  projectId: string;
  onClose: () => void;
}

interface ExportOptions {
  includeTokens: boolean;
  includeComponents: boolean;
  includeGuides: boolean;
  includeManifest: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeTokens: true,
  includeComponents: true,
  includeGuides: true,
  includeManifest: true,
};

type WizardStep = 1 | 2 | 3;

export function ExportWizard({ projectId, onClose }: Props) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const logExport = useProjectStore((s) => s.logExport);
  const updateSeed = useProjectStore((s) => s.updateSeed);
  const updateSeedColor = useProjectStore((s) => s.updateSeedColor);
  const recordAutoFix = useProjectStore((s) => s.recordAutoFix);

  const [step, setStep] = useState<WizardStep>(1);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
  const [exportResult, setExportResult] = useState<BundleResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // 프로젝트 상태가 변하거나 wizard가 열릴 때마다 체크 재실행.
  useEffect(() => {
    if (!project) return;
    const tree = generateTokenTree(projectToEffectivePreset(project));
    setChecks(runSelfChecks(tree));
  }, [project]);

  const blockingFails = useMemo(
    () => checks.filter((c) => c.status === "fail" && c.criterion.processing === "block"),
    [checks],
  );
  const canProceedToStep2 = blockingFails.length === 0;

  const applyPatch = useCallback(
    (patch: SeedPatch) => {
      if (!project) return;
      if (patch.color) {
        for (const [key, value] of Object.entries(patch.color)) {
          if (typeof value === "string") {
            updateSeedColor(project.id, key as keyof SeedTokens["color"], value);
          }
        }
      }
      const { color: _color, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        updateSeed(project.id, rest);
      }
    },
    [project, updateSeed, updateSeedColor],
  );

  /** 단일 fix 적용 + audit 기록. */
  const applyOneFix = useCallback(
    (criterionId: string, description: string, patch: SeedPatch) => {
      if (!project) return;
      applyPatch(patch);
      recordAutoFix(project.id, {
        criterionId,
        description,
        appliedAt: new Date().toISOString(),
      });
    },
    [project, applyPatch, recordAutoFix],
  );

  /** 배치 fix — merged patch 한 번에 적용 + 항목별 audit 기록. */
  const applyAllFixes = useCallback(
    (fails: CheckResult[]) => {
      if (!project) return;
      const merged = mergeAutoFixes(fails);
      if (merged) applyPatch(merged);
      const at = new Date().toISOString();
      for (const f of fails) {
        if (f.fix?.description && hasUsefulFix(f)) {
          recordAutoFix(project.id, {
            criterionId: f.criterionId,
            description: f.fix.description,
            appliedAt: at,
          });
        }
      }
    },
    [project, applyPatch, recordAutoFix],
  );

  const runExport = useCallback(async () => {
    if (!project) return;
    setStep(3);
    setExportError(null);
    setExportResult(null);
    try {
      const tree = generateTokenTree(projectToEffectivePreset(project));
      const currentChecks = runSelfChecks(tree);
      const result = await bundleArtifacts({
        tree,
        project: {
          id: project.id,
          name: project.name,
          type: project.type,
          version: project.version,
          createdBy: project.createdBy,
          createdByVerified: project.createdByVerified,
          createdAt: project.createdAt,
        },
        checks: currentChecks,
        appliedAutoFixes: project.appliedAutoFixes,
        // Step 2 옵션을 bundle에 전달 — bundleArtifacts는 항상 전체 생성하므로
        // v0.1에서는 옵션은 UI 표시용으로만 사용하고 zip은 풀 패키지 유지.
        // (옵션을 실제로 반영하는 부분 export는 Phase B 후속 작업.)
      });
      triggerDownload(result.blob, result.filename);
      setExportResult(result);
      const bundleOutput: ActivityOutput = {
        type: "bundle",
        filename: result.filename,
        size: result.blob.size,
        version: project.version,
        generatorVersion: GENERATOR_VERSION,
      };
      logExport(project.id, [bundleOutput]);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export 실패");
    }
  }, [project, logExport]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-wizard-title"
      className="fixed inset-0 z-30 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 3) onClose();
      }}
    >
      <div
        className="w-[680px] max-w-[94vw] max-h-[90vh] flex flex-col rounded-lg"
        style={{
          background: "var(--xds-tool-surface)",
          border: "1px solid var(--xds-tool-border)",
          boxShadow: "var(--xds-tool-shadow-md)",
        }}
      >
        <WizardHeader step={step} onClose={onClose} closeDisabled={step === 3 && !exportResult && !exportError} />
        <StepIndicator step={step} />
        <div className="flex-1 overflow-y-auto">
          {step === 1 ? (
            <ValidationStep
              checks={checks}
              blockingFails={blockingFails}
              canProceed={canProceedToStep2}
              onApplyOne={applyOneFix}
              onApplyAll={applyAllFixes}
            />
          ) : step === 2 ? (
            <OptionsStep
              project={project}
              options={options}
              onChange={setOptions}
            />
          ) : (
            <ProcessingStep result={exportResult} error={exportError} />
          )}
        </div>
        <WizardFooter
          step={step}
          canProceed={canProceedToStep2}
          exportResult={exportResult}
          exportError={exportError}
          onNext={() => setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s))}
          onBack={() => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))}
          onExport={runExport}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function WizardHeader({
  step,
  onClose,
  closeDisabled,
}: {
  step: WizardStep;
  onClose: () => void;
  closeDisabled: boolean;
}) {
  const titles: Record<WizardStep, string> = {
    1: "Export — 1단계: 접근성 검증",
    2: "Export — 2단계: 옵션 선택",
    3: "Export — 3단계: 처리",
  };
  return (
    <header
      className="flex items-start justify-between px-5 py-4"
      style={{ borderBottom: "1px solid var(--xds-tool-border)" }}
    >
      <h2 id="export-wizard-title" className="text-base font-semibold">
        {titles[step]}
      </h2>
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="닫기"
        className="p-1 rounded shrink-0 disabled:opacity-30"
        style={{ color: "var(--xds-tool-text-muted)" }}
      >
        <X className="size-4" />
      </button>
    </header>
  );
}

function StepIndicator({ step }: { step: WizardStep }) {
  return (
    <div
      className="px-5 py-2 flex items-center gap-2 text-[11px]"
      style={{
        background: "var(--xds-tool-elevated)",
        borderBottom: "1px solid var(--xds-tool-border)",
        color: "var(--xds-tool-text-muted)",
      }}
    >
      {([1, 2, 3] as WizardStep[]).map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 ? <span aria-hidden>·</span> : null}
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              color: step === n ? "var(--xds-tool-text)" : "var(--xds-tool-text-muted)",
              fontWeight: step === n ? 600 : 400,
            }}
          >
            <span
              className="size-4 inline-flex items-center justify-center rounded-full text-[10px]"
              style={{
                background:
                  step > n
                    ? "var(--xds-tool-success)"
                    : step === n
                    ? "var(--xds-tool-primary)"
                    : "var(--xds-tool-border)",
                color: step >= n ? "white" : "var(--xds-tool-text-muted)",
              }}
            >
              {step > n ? <Check className="size-2.5" aria-hidden /> : n}
            </span>
            {n === 1 ? "검증" : n === 2 ? "옵션" : "처리"}
          </span>
        </span>
      ))}
    </div>
  );
}

function ValidationStep({
  checks,
  blockingFails,
  canProceed,
  onApplyOne,
  onApplyAll,
}: {
  checks: CheckResult[];
  blockingFails: CheckResult[];
  canProceed: boolean;
  onApplyOne: (criterionId: string, description: string, patch: SeedPatch) => void;
  onApplyAll: (fails: CheckResult[]) => void;
}) {
  const summary = useMemo(() => {
    const out = { pass: 0, fail: 0, warn: 0, manual: 0 };
    for (const c of checks) out[c.status] += 1;
    return out;
  }, [checks]);
  const batchFix = useMemo(() => mergeAutoFixes(checks), [checks]);
  const batchFixUseful = batchFix !== null && Object.keys(batchFix).length > 0;
  const fixableCount = blockingFails.filter((f) => hasUsefulFix(f)).length;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        {canProceed ? (
          <Check className="size-5" style={{ color: "var(--xds-tool-success)" }} aria-hidden />
        ) : (
          <AlertTriangle className="size-5" style={{ color: "var(--xds-tool-danger)" }} aria-hidden />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {canProceed
              ? "차단 항목 없음 — Export 가능합니다"
              : `차단 항목 ${blockingFails.length}건 — 보정 후 다음 단계로 진행 가능`}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--xds-tool-text-muted)" }}>
            전체 {checks.length}건 · 통과 {summary.pass} · 미달 {summary.fail} · 경고 {summary.warn} · 수동 {summary.manual}
          </p>
        </div>
      </div>

      {blockingFails.length > 0 ? (
        <>
          <div
            className="flex items-center justify-between gap-2 p-2 rounded"
            style={{ background: "var(--xds-tool-elevated)" }}
          >
            <span className="text-xs" style={{ color: "var(--xds-tool-text-muted)" }}>
              자동 보정 가능 {fixableCount}건
            </span>
            {batchFixUseful ? (
              <button
                type="button"
                onClick={() => onApplyAll(blockingFails)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded"
                style={{
                  background: "var(--xds-tool-primary)",
                  color: "var(--xds-tool-primary-fg)",
                }}
                aria-label="모든 자동 보정 가능 항목 한 번에 적용"
              >
                <Wand2 className="size-3.5" aria-hidden />
                한 번에 보정
              </button>
            ) : null}
          </div>
          <ul className="space-y-2">
            {blockingFails.map((r) => (
              <FailCard
                key={r.criterionId}
                result={r}
                onApplyFix={() =>
                  r.fix && onApplyOne(r.criterionId, r.fix.description, r.fix.patch)
                }
              />
            ))}
          </ul>
        </>
      ) : (
        <div
          className="p-4 rounded text-xs"
          style={{
            background: "var(--xds-tool-elevated)",
            color: "var(--xds-tool-text-muted)",
          }}
        >
          모든 자동 검증 항목이 통과했습니다. [다음] 버튼으로 Export 옵션을 선택해주세요.
        </div>
      )}
    </div>
  );
}

function OptionsStep({
  project,
  options,
  onChange,
}: {
  project: { name: string; version: string };
  options: ExportOptions;
  onChange: (next: ExportOptions) => void;
}) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `${project.name}-design-system_v${project.version}_${date}.zip`;
  return (
    <div className="p-5 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">포함할 파일 그룹</h3>
        <div className="space-y-1.5">
          <OptionRow
            label="토큰 파일 (tokens.css, tokens.json, tokens.ts, seed/map/alias JSON)"
            checked={options.includeTokens}
            onChange={(v) => onChange({ ...options, includeTokens: v })}
          />
          <OptionRow
            label="컴포넌트 명세 (Markdown)"
            checked={options.includeComponents}
            onChange={(v) => onChange({ ...options, includeComponents: v })}
          />
          <OptionRow
            label="가이드 (접근성 리포트 등)"
            checked={options.includeGuides}
            onChange={(v) => onChange({ ...options, includeGuides: v })}
          />
          <OptionRow
            label="매니페스트 (manifest.json — 항상 권장)"
            checked={options.includeManifest}
            onChange={(v) => onChange({ ...options, includeManifest: v })}
          />
        </div>
        <p
          className="text-[11px] mt-2"
          style={{ color: "var(--xds-tool-text-muted)" }}
        >
          v0.1에서는 옵션 체크가 UI 미리보기용입니다. 실제 zip은 풀 패키지로 생성됩니다 — 부분 export는 Phase B 후속에서 추가됩니다.
        </p>
      </div>
      <div
        className="p-3 rounded"
        style={{
          background: "var(--xds-tool-elevated)",
          border: "1px solid var(--xds-tool-border)",
        }}
      >
        <div className="text-[11px]" style={{ color: "var(--xds-tool-text-muted)" }}>
          예상 파일명
        </div>
        <div className="text-sm font-mono mt-0.5 break-all">{filename}</div>
      </div>
    </div>
  );
}

function OptionRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4"
      />
      <span>{label}</span>
    </label>
  );
}

function ProcessingStep({
  result,
  error,
}: {
  result: BundleResult | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-3">
        <AlertTriangle
          className="size-8"
          style={{ color: "var(--xds-tool-danger)" }}
          aria-hidden
        />
        <p className="text-sm font-medium">Export 실패</p>
        <p className="text-xs" style={{ color: "var(--xds-tool-text-muted)" }}>
          {error}
        </p>
      </div>
    );
  }
  if (!result) {
    return (
      <div className="p-10 flex flex-col items-center gap-3">
        <Loader2
          className="size-8 animate-spin"
          style={{ color: "var(--xds-tool-primary)" }}
          aria-hidden
        />
        <p className="text-sm">패키지 생성 중…</p>
      </div>
    );
  }
  const totalSize = result.files.reduce((sum, f) => sum + f.content.length, 0);
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Check
          className="size-5"
          style={{ color: "var(--xds-tool-success)" }}
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium">Export 완료</p>
          <p className="text-xs" style={{ color: "var(--xds-tool-text-muted)" }}>
            다운로드가 자동으로 시작되었습니다 (브라우저 차단 시 아래에서 직접)
          </p>
        </div>
      </div>
      <div
        className="p-3 rounded"
        style={{
          background: "var(--xds-tool-elevated)",
          border: "1px solid var(--xds-tool-border)",
        }}
      >
        <div className="text-[11px]" style={{ color: "var(--xds-tool-text-muted)" }}>
          파일명
        </div>
        <div className="text-sm font-mono mt-0.5 break-all">{result.filename}</div>
        <div className="text-[11px] mt-1.5" style={{ color: "var(--xds-tool-text-muted)" }}>
          파일 수: {result.files.length} · 압축 전 크기: {formatBytes(totalSize)} · 압축 후: {formatBytes(result.blob.size)}
        </div>
      </div>
    </div>
  );
}

function WizardFooter({
  step,
  canProceed,
  exportResult,
  exportError,
  onNext,
  onBack,
  onExport,
  onClose,
}: {
  step: WizardStep;
  canProceed: boolean;
  exportResult: BundleResult | null;
  exportError: string | null;
  onNext: () => void;
  onBack: () => void;
  onExport: () => void;
  onClose: () => void;
}) {
  return (
    <footer
      className="px-5 py-4 flex items-center justify-end gap-2"
      style={{ borderTop: "1px solid var(--xds-tool-border)" }}
    >
      {step === 1 ? (
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" size="sm" onClick={onNext} disabled={!canProceed}>
            다음
          </Button>
        </>
      ) : step === 2 ? (
        <>
          <Button variant="ghost" size="sm" onClick={onBack}>
            이전
          </Button>
          <Button variant="primary" size="sm" onClick={onExport}>
            <Download className="size-3.5" />
            Export
          </Button>
        </>
      ) : (
        <Button variant="primary" size="sm" onClick={onClose} disabled={!exportResult && !exportError}>
          닫기
        </Button>
      )}
    </footer>
  );
}

function FailCard({
  result,
  onApplyFix,
}: {
  result: CheckResult;
  onApplyFix: () => void;
}) {
  const { criterion } = result;
  const fixUseful = hasUsefulFix(result);
  const [nodesOpen, setNodesOpen] = useState(false);
  const nodeCount = result.nodes?.length ?? 0;
  return (
    <li
      className="p-3 rounded"
      style={{
        background: "var(--xds-tool-elevated)",
        border: "1px solid var(--xds-tool-danger)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[11px] font-mono"
              style={{ color: "var(--xds-tool-text-muted)" }}
            >
              {criterion.id}
            </span>
            <span className="text-sm font-medium">{criterion.title}</span>
          </div>
          <p className="text-xs mt-1 leading-relaxed">{result.message}</p>
          {result.fix && fixUseful ? (
            <p
              className="text-[11px] mt-1.5"
              style={{ color: "var(--xds-tool-text-muted)" }}
            >
              제안: {result.fix.description}
            </p>
          ) : null}
          {nodeCount > 0 ? (
            <div className="mt-1.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: "var(--xds-tool-text-muted)" }}
                  onClick={() => setNodesOpen((v) => !v)}
                  aria-expanded={nodesOpen}
                >
                  {nodesOpen ? <ChevronDown className="size-3" aria-hidden /> : <ChevronRight className="size-3" aria-hidden />}
                  위반 요소 {nodeCount}건 {nodesOpen ? "접기" : "보기"}
                </button>
                <CopyButton
                  label="전체 복사"
                  text={formatNodesForCopy(criterion.id, result.nodes!)}
                />
              </div>
              {nodesOpen ? (
                <ul className="mt-1.5 space-y-1">
                  {result.nodes!.map((n, i) => (
                    <NodeRow key={`${n.target}-${i}`} node={n} />
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-[11px] font-mono tabular-nums"
            style={{ color: "var(--xds-tool-danger)" }}
          >
            {result.actual}
          </span>
          {result.fix && fixUseful ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded"
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
          ) : (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "transparent",
                color: "var(--xds-tool-text-muted)",
                border: "1px solid var(--xds-tool-border)",
              }}
            >
              수동 조정
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function NodeRow({ node }: { node: AxeNodeDetail }) {
  return (
    <li
      className="px-2 py-1.5 rounded text-[11px] leading-snug"
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
          {node.contrast ? (
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
          ) : null}
          {node.htmlSnippet ? (
            <div
              className="font-mono mt-0.5 break-all"
              style={{ color: "var(--xds-tool-text-muted)", opacity: 0.7 }}
            >
              {node.htmlSnippet}
            </div>
          ) : null}
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
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1200);
        } catch {
          // 클립보드 거부 — 무시.
        }
      }}
      className={
        compact
          ? "shrink-0 p-0.5 rounded"
          : "shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
      }
      style={{
        color: done ? "var(--xds-tool-success)" : "var(--xds-tool-text-muted)",
        border: "1px solid var(--xds-tool-border)",
      }}
      aria-label={done ? "복사됨" : label}
      title={done ? "복사됨" : label}
    >
      {done ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      {!compact ? <span>{done ? "복사됨" : label}</span> : null}
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

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}
