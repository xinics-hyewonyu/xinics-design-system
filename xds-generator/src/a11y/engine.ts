/**
 * 접근성 검증 엔진 — Accessibility Spec §4 자동 검증 매커니즘 구현.
 *
 * 두 갈래 검증을 단일 결과 리스트로 합친다:
 * - **Self rules** (동기): TokenTree만으로 판정 가능한 항목.
 *   대비비, 포커스 링 두께, 본문 폰트 크기, 터치 타겟, 한국어 자간·행간·폰트 스택.
 * - **axe-core** (비동기): 실제 DOM이 있어야 판정 가능한 항목.
 *   라벨, 키보드 순서, ARIA 유효성, 페이지 제목 등.
 *
 * 출력은 `CheckResult` 통합 형식이며, 미달 항목 중 알고리즘적으로 해소 가능한
 * 경우 `fix` (SeedTokens 패치)를 함께 제안한다 (Spec §5).
 */

import axe, { type AxeResults, type Result as AxeRuleResult } from "axe-core";
import {
  contrastRatio,
  formatOklch,
  parseColor,
} from "../tokens/algorithms/oklch";
import { resolveTokenRef } from "../tokens/build";
import { COLOR_SCALE_STEPS } from "../tokens/types";
import type { ColorScaleStep, SeedTokens, TokenTree } from "../tokens/types";
import {
  CRITERIA,
  CRITERIA_BY_ID,
  autoVerifiableCriteria,
  type Criterion,
} from "./criteria";
import { runKoreanChecks } from "./koreanRules";

export type CheckStatus = "pass" | "fail" | "warn" | "manual";

export interface AutoFix {
  /** UI에 그대로 노출되는 한 줄 설명. */
  description: string;
  /** Seed 패치 — `updateSeed` 액션이 그대로 소비 가능. */
  patch: SeedPatch;
}

export type SeedPatch = {
  color?: Partial<SeedTokens["color"]>;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string[];
  spacingBase?: number;
  density?: SeedTokens["density"];
  wireframe?: boolean;
  focusRingColorStep?: ColorScaleStep;
  actionPrimaryStep?: ColorScaleStep;
  actionDangerStep?: ColorScaleStep;
};

export interface AxeNodeDetail {
  /** 요소를 가리키는 CSS 셀렉터 (axe `target`). */
  target: string;
  /** axe가 제공하는 사람 친화적 위반 요약 (없는 경우도 있음). */
  failureSummary?: string;
  /** color-contrast 룰에 한해 채워지는 측정값. */
  contrast?: {
    fg: string;
    bg: string;
    ratio: number;
    expected: number;
    fontSizeCss?: string;
    fontWeight?: string | number;
  };
  /** outerHTML 발췌 (길면 자름). */
  htmlSnippet: string;
}

export interface CheckResult {
  criterionId: string;
  criterion: Criterion;
  status: CheckStatus;
  /** 측정 값 (UI 우측 라벨용). 예: "3.8:1", "1.4em", "—". */
  actual: string;
  /** 한 줄 메시지. 미달 사유 또는 통과 확인. */
  message: string;
  /** 추가 설명(원인 토큰 경로 등). */
  detail?: string;
  /** axe-core 위반 요소들 — UI에서 펼쳐 보여줄 수 있게. */
  nodes?: AxeNodeDetail[];
  fix?: AutoFix;
}

// =============================================================================
// Self rules — Token Tree만으로 동기 검증
// =============================================================================

const NOT_APPLICABLE: CheckResult[] = []; // 가독성용 sentinel

/** TokenTree만으로 가능한 모든 self check를 실행한다. */
export function runSelfChecks(tree: TokenTree): CheckResult[] {
  return [
    ...checkContrasts(tree),
    ...checkFocusRing(tree),
    ...checkBodyFontSize(tree),
    ...checkTouchTarget(tree),
    ...runKoreanChecks(tree),
  ];
}

type ContrastFixKind =
  | { kind: "darken-seed-color"; seedKey: keyof SeedTokens["color"] }
  | { kind: "darken-action-step"; action: "primary" | "danger" };

interface ContrastTarget {
  id: "P-01" | "P-02" | "P-03";
  fgRef: string;
  bgRef: string;
  /** UI 라벨용 페어 이름. */
  pairName: string;
  /** 보정 전략. null이면 보정 제안 안 함. */
  fix: ContrastFixKind | null;
  min: number;
}

function checkContrasts(tree: TokenTree): CheckResult[] {
  const targets: ContrastTarget[] = [
    {
      id: "P-01",
      fgRef: tree.alias.text.body,
      bgRef: tree.alias.surface.base,
      pairName: "본문 텍스트 × 배경",
      fix: { kind: "darken-seed-color", seedKey: "textBase" },
      min: 4.5,
    },
    {
      id: "P-01",
      fgRef: tree.alias.text.onPrimary,
      bgRef: tree.alias.action.primary,
      pairName: "Primary 라벨 × Primary 배경",
      fix: { kind: "darken-action-step", action: "primary" },
      min: 4.5,
    },
    {
      id: "P-01",
      fgRef: tree.alias.text.onDanger,
      bgRef: tree.alias.action.danger,
      pairName: "Danger 라벨 × Danger 배경",
      fix: { kind: "darken-action-step", action: "danger" },
      min: 4.5,
    },
    {
      id: "P-01",
      fgRef: tree.alias.text.link,
      bgRef: tree.alias.surface.base,
      pairName: "Link 텍스트 × 배경",
      // link는 seed.primary를 직접 따라가므로 보정 방향은 seed.primary 어둡게.
      fix: { kind: "darken-seed-color", seedKey: "primary" },
      min: 4.5,
    },
    {
      id: "P-02",
      fgRef: tree.alias.text.heading,
      bgRef: tree.alias.surface.base,
      pairName: "헤딩 × 배경",
      fix: { kind: "darken-seed-color", seedKey: "textBase" },
      min: 3.0,
    },
    {
      id: "P-03",
      fgRef: tree.alias.action.primary,
      bgRef: tree.alias.surface.base,
      pairName: "Primary 액션 × 배경",
      fix: { kind: "darken-seed-color", seedKey: "primary" },
      min: 3.0,
    },
  ];

  const perTarget = targets.map((t) => evaluateTarget(t, tree));
  return aggregateByCriterion(perTarget);
}

interface TargetEvaluation {
  target: ContrastTarget;
  ratio: number;
  pass: boolean;
  fg: string;
  bg: string;
  fixPatch: SeedPatch | null;
  fixDescription: string | null;
}

function evaluateTarget(t: ContrastTarget, tree: TokenTree): TargetEvaluation {
  const fg = resolveTokenRef(t.fgRef, tree);
  const bg = resolveTokenRef(t.bgRef, tree);
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= t.min;
  let fixPatch: SeedPatch | null = null;
  let fixDescription: string | null = null;

  if (!pass && t.fix) {
    if (t.fix.kind === "darken-seed-color") {
      const seedKey = t.fix.seedKey;
      const seedValue = tree.seed.color[seedKey];
      const corrected = findDarkerForContrast(seedValue, bg, t.min + 0.05);
      if (corrected) {
        fixPatch = {
          color: { [seedKey]: corrected } as Partial<SeedTokens["color"]>,
        };
        fixDescription = `${seedKey} 색을 어둡게 조정해 ${t.min}:1 통과`;
      }
    } else if (t.fix.kind === "darken-action-step") {
      const action = t.fix.action;
      const scaleKey = action === "primary" ? "primary" : "error";
      // step 오버라이드가 없으면 seed 색을 직접 쓰는 상태. 그 경우 "500"부터 탐색해
      // 첫 통과 단계를 제안한다 (사용자가 fix를 적용하면 그 단계로 전환).
      const currentStep =
        action === "primary"
          ? tree.seed.actionPrimaryStep ?? "400"
          : tree.seed.actionDangerStep ?? "400";
      const darker = findDarkerScaleStep(tree, scaleKey, currentStep, fg, t.min + 0.05);
      if (darker) {
        fixPatch =
          action === "primary"
            ? { actionPrimaryStep: darker.step }
            : { actionDangerStep: darker.step };
        fixDescription = `${
          action === "primary" ? "Primary" : "Danger"
        } 배경을 ${scaleKey}.${darker.step}로 조정 (대비 ${darker.ratio.toFixed(2)}:1)`;
      }
    }
  }

  return { target: t, ratio, pass, fg, bg, fixPatch, fixDescription };
}

/** 같은 criterion id로 들어온 여러 페어 평가를 하나의 CheckResult로 통합. */
function aggregateByCriterion(perTarget: TargetEvaluation[]): CheckResult[] {
  const grouped = new Map<string, TargetEvaluation[]>();
  for (const e of perTarget) {
    const arr = grouped.get(e.target.id) ?? [];
    arr.push(e);
    grouped.set(e.target.id, arr);
  }
  const out: CheckResult[] = [];
  for (const [id, group] of grouped) {
    const criterion = CRITERIA_BY_ID[id];
    const fails = group.filter((g) => !g.pass);
    const pass = fails.length === 0;
    const worst = group.reduce((a, b) => (a.ratio < b.ratio ? a : b));

    const result: CheckResult = {
      criterionId: id,
      criterion,
      status: pass ? "pass" : "fail",
      actual: `${worst.ratio.toFixed(2)}:1`,
      message: pass
        ? `${criterion.title} — 모든 페어 통과 (최소 ${worst.ratio.toFixed(2)}:1)`
        : fails.length === 1
        ? `${fails[0].target.pairName} 대비비 ${fails[0].ratio.toFixed(2)}:1 (최소 ${fails[0].target.min}:1)`
        : `${fails.length}개 페어 대비 미달 — 가장 낮음: ${worst.target.pairName} ${worst.ratio.toFixed(2)}:1`,
      detail: fails.length > 0
        ? fails.map((f) => `${f.target.pairName}: ${f.target.fgRef} on ${f.target.bgRef}`).join(" / ")
        : undefined,
    };

    // 모든 실패 페어의 fix patch 머지
    const fixes = group.filter((g) => !g.pass && g.fixPatch);
    if (fixes.length > 0) {
      const mergedPatch: SeedPatch = {};
      const descriptions: string[] = [];
      for (const f of fixes) {
        if (!f.fixPatch) continue;
        if (f.fixPatch.color) {
          mergedPatch.color = { ...(mergedPatch.color ?? {}), ...f.fixPatch.color };
        }
        if (f.fixPatch.actionPrimaryStep) mergedPatch.actionPrimaryStep = f.fixPatch.actionPrimaryStep;
        if (f.fixPatch.actionDangerStep) mergedPatch.actionDangerStep = f.fixPatch.actionDangerStep;
        if (f.fixDescription) descriptions.push(f.fixDescription);
      }
      if (Object.keys(mergedPatch).length > 0) {
        result.fix = {
          description: descriptions.join(" + "),
          patch: mergedPatch,
        };
      }
    }
    out.push(result);
  }
  return out;
}

/**
 * primary/error 스케일에서 현재 step보다 어두운 단계 중 fg와 target 이상 대비를
 * 만드는 가장 가까운 단계를 반환.
 */
function findDarkerScaleStep(
  tree: TokenTree,
  scaleKey: "primary" | "error",
  currentStep: ColorScaleStep,
  fg: string,
  target: number,
): { step: ColorScaleStep; ratio: number } | null {
  const currentIdx = COLOR_SCALE_STEPS.indexOf(currentStep);
  for (let i = currentIdx + 1; i < COLOR_SCALE_STEPS.length; i += 1) {
    const step = COLOR_SCALE_STEPS[i];
    const value = tree.map.color[scaleKey][step];
    const ratio = contrastRatio(fg, value);
    if (ratio >= target) return { step, ratio };
  }
  return null;
}

function checkFocusRing(tree: TokenTree): CheckResult[] {
  const criterion = CRITERIA_BY_ID["O-03"];
  const width = tree.alias.focus.ring.width;
  const ringColor = resolveTokenRef(tree.alias.focus.ring.color, tree);
  const bg = resolveTokenRef(tree.alias.surface.base, tree);
  const ratio = contrastRatio(ringColor, bg);
  const widthOk = width >= 2;
  const ratioOk = ratio >= 3;
  const pass = widthOk && ratioOk;
  const reasons: string[] = [];
  if (!widthOk) reasons.push(`두께 ${width}px (최소 2px)`);
  if (!ratioOk) reasons.push(`대비 ${ratio.toFixed(2)}:1 (최소 3:1)`);

  const result: CheckResult = {
    criterionId: "O-03",
    criterion,
    status: pass ? "pass" : "fail",
    actual: `${width}px · ${ratio.toFixed(2)}:1`,
    message: pass
      ? `포커스 링 ${width}px · 대비 ${ratio.toFixed(2)}:1 — 통과`
      : `포커스 링 미달: ${reasons.join(", ")}`,
    detail: `${tree.alias.focus.ring.color} on ${tree.alias.surface.base}`,
  };
  // 두께(width)는 현재 alias에 하드코딩(2px)이라 미달이 사실상 안 나옴 — 보정 제안 없음.
  // 대비 부족(ratioOk=false)일 때만 primary 스케일을 어두운 쪽으로 탐색해 통과 단계 제안.
  if (!ratioOk) {
    const darker = findDarkerPrimaryStep(tree, bg, 3.05);
    if (darker) {
      result.fix = {
        description: `포커스 링 색을 primary.${darker.step}로 변경 (대비 ${darker.ratio.toFixed(2)}:1)`,
        patch: { focusRingColorStep: darker.step },
      };
    }
  }
  return [result];
}

/**
 * primary 스케일에서 surface.base 대비 target 이상을 통과하는 가장 가까운(현재 단계와
 * 가장 인접한 어두운 단계부터 탐색) 단계를 찾는다.
 */
function findDarkerPrimaryStep(
  tree: TokenTree,
  bg: string,
  target: number,
): { step: ColorScaleStep; ratio: number } | null {
  const current = tree.seed.focusRingColorStep ?? "400";
  const currentIdx = COLOR_SCALE_STEPS.indexOf(current);
  // 현재 단계보다 어두운 단계들만 후보 (인덱스가 더 큰 쪽 — 500, 600, 700, ...).
  for (let i = currentIdx + 1; i < COLOR_SCALE_STEPS.length; i += 1) {
    const step = COLOR_SCALE_STEPS[i];
    const value = tree.map.color.primary[step];
    const ratio = contrastRatio(value, bg);
    if (ratio >= target) return { step, ratio };
  }
  return null;
}

function checkBodyFontSize(tree: TokenTree): CheckResult[] {
  const criterion = CRITERIA_BY_ID["P-10"];
  const size = tree.seed.fontSize;
  const pass = size >= 13;
  const result: CheckResult = {
    criterionId: "P-10",
    criterion,
    status: pass ? "pass" : "fail",
    actual: `${size}px`,
    message: pass
      ? `본문 폰트 크기 ${size}px — 통과`
      : `본문 폰트 크기 ${size}px이 13px 미만`,
  };
  if (!pass) {
    result.fix = {
      description: "본문 폰트 크기를 13px로 적용",
      patch: { fontSize: 13 },
    };
  }
  return [result];
}

function checkTouchTarget(tree: TokenTree): CheckResult[] {
  const criterion = CRITERIA_BY_ID["O-09"];
  const minHeight = tree.alias.control.height.sm;
  const pass = minHeight >= 24;
  return [
    {
      criterionId: "O-09",
      criterion,
      status: pass ? "pass" : "fail",
      actual: `${minHeight}px`,
      message: pass
        ? `최소 컨트롤 높이 ${minHeight}px — 통과 (모바일 별도 확인 필요)`
        : `컨트롤 sm 높이 ${minHeight}px이 24px 미만`,
      // 모바일 44×44 강제는 Sprint 1D viewport 토글과 함께 확장.
    },
  ];
}

// =============================================================================
// axe-core 통합 — 실제 DOM 노드에 대해 비동기 검사
// =============================================================================

/**
 * axe-core 룰 → CRITERION 매핑 (criteria.ts의 axeRule 필드 역인덱스).
 * 한 axe 룰이 여러 항목에 영향을 줄 수 있으므로 Map<rule, Criterion[]>.
 */
const AXE_RULE_TO_CRITERIA: Map<string, Criterion[]> = (() => {
  const m = new Map<string, Criterion[]>();
  for (const c of CRITERIA) {
    if (!c.axeRule) continue;
    const arr = m.get(c.axeRule);
    if (arr) arr.push(c);
    else m.set(c.axeRule, [c]);
  }
  return m;
})();

/** 자동 검증 가능 + axeRule 매핑이 있는 항목 ID 목록. */
const AXE_RULES = Array.from(AXE_RULE_TO_CRITERIA.keys());

/**
 * 주어진 DOM 노드에 axe-core를 실행한다.
 * `runOnly`로 매핑된 룰만 켜서 잡음·시간을 줄인다.
 */
export async function runAxeChecks(root: HTMLElement | Document): Promise<CheckResult[]> {
  if (AXE_RULES.length === 0) return NOT_APPLICABLE;
  const results: AxeResults = await axe.run(root, {
    runOnly: { type: "rule", values: AXE_RULES },
    resultTypes: ["violations", "passes", "incomplete"],
  });
  const out: CheckResult[] = [];
  // axe는 같은 룰의 노드를 status별로 분리해 반환한다 — 통과 노드는 passes 버킷에,
  // 미달 노드는 violations 버킷에 들어간다. 버킷별로 명시 분류해야 통과 노드를
  // 위반으로 오분류하지 않는다 (이전 .some() 기반 분류는 같은 룰이 양쪽에 있으면
  // 통과 노드까지 fail로 표시했다).
  const pushFromBucket = (
    rules: AxeRuleResult[],
    violation: boolean,
    incomplete: boolean,
  ) => {
    for (const rule of rules) {
      const mapped = AXE_RULE_TO_CRITERIA.get(rule.id);
      if (!mapped) continue;
      for (const criterion of mapped) {
        out.push(toCheckResult(rule, criterion, violation, incomplete));
      }
    }
  };
  pushFromBucket(results.violations, true, false);
  pushFromBucket(results.incomplete, false, true);
  pushFromBucket(results.passes, false, false);
  return out;
}

function toCheckResult(
  rule: AxeRuleResult,
  criterion: Criterion,
  violation: boolean,
  incomplete: boolean,
): CheckResult {
  const status: CheckStatus = violation ? "fail" : incomplete ? "manual" : "pass";
  const nodeCount = rule.nodes.length;
  const result: CheckResult = {
    criterionId: criterion.id,
    criterion,
    status,
    actual: violation ? `위반 ${nodeCount}건` : incomplete ? "수동 검토 필요" : "통과",
    message: violation
      ? `${criterion.title} — axe-core: ${rule.help} (${nodeCount}건)`
      : incomplete
      ? `${criterion.title} — 자동 판정 불가, 수동 검토 필요`
      : `${criterion.title} — 통과`,
    detail: rule.helpUrl,
  };
  if (violation || incomplete) {
    result.nodes = rule.nodes.map(extractNodeDetail);
  }
  return result;
}

interface ColorContrastData {
  fgColor?: string;
  bgColor?: string;
  contrastRatio?: number;
  expectedContrastRatio?: number | string;
  fontSize?: string;
  fontWeight?: string | number;
}

function extractNodeDetail(node: AxeRuleResult["nodes"][number]): AxeNodeDetail {
  const target = Array.isArray(node.target) ? node.target.join(" ") : String(node.target);
  const html = typeof node.html === "string" ? node.html : "";
  const htmlSnippet = html.length > 240 ? `${html.slice(0, 237)}…` : html;
  const detail: AxeNodeDetail = {
    target,
    failureSummary: node.failureSummary ?? undefined,
    htmlSnippet,
  };
  // color-contrast의 측정값은 any[*].data에 들어있음. 첫 매칭만 사용.
  const checks = [...(node.any ?? []), ...(node.all ?? []), ...(node.none ?? [])];
  for (const c of checks) {
    const data = c.data as ColorContrastData | null | undefined;
    if (data && typeof data === "object" && typeof data.contrastRatio === "number") {
      const expected =
        typeof data.expectedContrastRatio === "number"
          ? data.expectedContrastRatio
          : typeof data.expectedContrastRatio === "string"
          ? Number.parseFloat(data.expectedContrastRatio)
          : NaN;
      detail.contrast = {
        fg: data.fgColor ?? "?",
        bg: data.bgColor ?? "?",
        ratio: data.contrastRatio,
        expected: Number.isFinite(expected) ? expected : 4.5,
        fontSizeCss: data.fontSize,
        fontWeight: data.fontWeight,
      };
      break;
    }
  }
  return detail;
}

// =============================================================================
// 통합 실행
// =============================================================================

export interface RunOptions {
  /** axe를 돌릴 DOM 루트. 생략 시 axe 단계 skip. 테스트·SSR 환경에서 유용. */
  root?: HTMLElement | Document | null;
}

/**
 * Self + axe 모두 실행하여 통합 결과 반환.
 *
 * 동일 criterionId가 양쪽에서 나오면 axe의 fail 우선(보다 구체적인 검출이므로),
 * 그 외엔 self 결과를 유지한다.
 */
export async function runAllChecks(
  tree: TokenTree,
  opts: RunOptions = {},
): Promise<CheckResult[]> {
  const self = runSelfChecks(tree);
  let axeOut: CheckResult[] = [];
  if (opts.root && typeof window !== "undefined") {
    try {
      axeOut = await runAxeChecks(opts.root);
    } catch {
      // 환경 미지원 (JSDOM 등) — self 결과만 사용.
      axeOut = [];
    }
  }
  const byId = new Map<string, CheckResult>();
  for (const r of self) byId.set(r.criterionId, r);
  for (const r of axeOut) {
    const prev = byId.get(r.criterionId);
    if (!prev) {
      byId.set(r.criterionId, r);
      continue;
    }
    if (r.status === "fail") {
      // axe가 더 구체적인 위반(노드 목록)을 알지만, self의 자동 보정 패치를
      // 잃지 않도록 머지한다. 같은 메시지가 둘 다 fail이라도 axe.nodes를 살린다.
      const merged: CheckResult = {
        ...r,
        fix: r.fix ?? prev.fix,
        // self는 토큰 페어 detail이 더 의미있는 경우가 있으므로 axe의 detail을
        // 그대로 쓰되 self detail이 있으면 함께 보여준다.
        detail:
          r.detail && prev.detail && r.detail !== prev.detail
            ? `${r.detail} · ${prev.detail}`
            : r.detail ?? prev.detail,
      };
      byId.set(r.criterionId, merged);
    }
    // r.status === "pass" or "manual" + prev exists → keep prev (self가 더 의미있음)
  }
  // 남은 자동 항목 중 검사되지 않은 것은 manual 표시 (UI에서 회색 처리).
  for (const c of autoVerifiableCriteria()) {
    if (!byId.has(c.id)) {
      byId.set(c.id, {
        criterionId: c.id,
        criterion: c,
        status: "manual",
        actual: "—",
        message: `${c.title} — 자동 검증 미구현 (수동 확인 필요)`,
      });
    }
  }
  // criteria.ts 순서를 보존해 카테고리별 정렬이 자연스럽게 되도록.
  return CRITERIA.filter((c) => byId.has(c.id)).map((c) => byId.get(c.id)!);
}

/** 미달 항목 중 자동 보정 가능한 것의 패치를 모두 합쳐 한 번에 적용 가능한 patch로 반환. */
export function mergeAutoFixes(results: readonly CheckResult[]): SeedPatch | null {
  const fails = results.filter((r) => r.status === "fail" && r.fix);
  if (fails.length === 0) return null;
  const merged: SeedPatch = {};
  for (const r of fails) {
    if (!r.fix) continue;
    const p = r.fix.patch;
    if (p.color) merged.color = { ...(merged.color ?? {}), ...p.color };
    if (p.fontSize !== undefined) merged.fontSize = p.fontSize;
    if (p.borderRadius !== undefined) merged.borderRadius = p.borderRadius;
    if (p.fontFamily !== undefined) merged.fontFamily = p.fontFamily;
    if (p.spacingBase !== undefined) merged.spacingBase = p.spacingBase;
    if (p.density !== undefined) merged.density = p.density;
    if (p.wireframe !== undefined) merged.wireframe = p.wireframe;
    if (p.focusRingColorStep !== undefined) merged.focusRingColorStep = p.focusRingColorStep;
    if (p.actionPrimaryStep !== undefined) merged.actionPrimaryStep = p.actionPrimaryStep;
    if (p.actionDangerStep !== undefined) merged.actionDangerStep = p.actionDangerStep;
  }
  return Object.keys(merged).length > 0 ? merged : null;
}

// =============================================================================
// 보정 알고리즘 — OKLCH L 축에서 하강 탐색
// =============================================================================

/**
 * fg를 점진적으로 어둡게 해 bg와의 대비비가 target 이상이 되는 가장 가까운 색을 반환.
 * 명도 0.05까지 내려도 통과 못 하면 null.
 */
export function findDarkerForContrast(
  fg: string,
  bg: string,
  target: number,
): string | null {
  const parsed = parseColor(fg);
  if (!parsed) return null;
  const STEP = 0.02;
  for (let l = parsed.l; l >= 0.05; l -= STEP) {
    const candidate = formatOklch({ ...parsed, l });
    if (contrastRatio(candidate, bg) >= target) return candidate;
  }
  return null;
}
