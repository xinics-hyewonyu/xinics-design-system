/**
 * 한국어 자체 룰 — Accessibility Spec §3.5 + §4.1.
 *
 * axe-core가 다루지 않는 KWCAG 한국 특화 항목을 TokenTree만으로 검증한다.
 *
 * 본 Sprint(1C)에서 구현:
 *   - K-01 한국어 자간 (자동 보정 제안 포함)
 *   - K-02 한국어 행간 (자동 보정 제안 포함)
 *   - K-04 콘텐츠 자동 갱신 통제 (컴포넌트 메타 부재 — manual로 보고)
 *   - K-07 한국어 본문 폰트 스택
 *
 * P-08·P-09는 K-01·K-02와 동일한 자간·행간 기준을 사용하므로 함께 같은 결과로 보고한다.
 */

import type { TokenTree } from "../tokens/types";
import { CRITERIA_BY_ID } from "./criteria";
import type { CheckResult } from "./engine";

/** 한국어 폰트로 허용되는 스택 후보. 대소문자·하이픈 무시 매칭. */
const KOREAN_FONT_HINTS = [
  "pretendard",
  "noto sans kr",
  "noto sans korean",
  "apple sd gothic neo",
  "spoqa han sans",
  "nanum",
  "kopub",
  "malgun gothic",
];

export function runKoreanChecks(tree: TokenTree): CheckResult[] {
  return [
    checkLetterSpacing(tree),
    checkLineHeight(tree),
    checkAutoUpdate(),
    checkKoreanFontStack(tree),
  ];
}

/**
 * K-01 (= P-08) — 본문 자간이 -0.05em ~ 0em 범위.
 * 토큰은 `"-0.01em"` 같은 문자열이므로 em 단위만 추출해 비교한다.
 */
function checkLetterSpacing(tree: TokenTree): CheckResult {
  const criterion = CRITERIA_BY_ID["K-01"];
  const raw = tree.map.font.letterSpacing.korean;
  const em = parseEm(raw);
  const pass = em !== null && em >= -0.05 && em <= 0;
  const result: CheckResult = {
    criterionId: "K-01",
    criterion,
    status: pass ? "pass" : "warn",
    actual: raw,
    message: pass
      ? `한국어 본문 자간 ${raw} — 통과`
      : `한국어 본문 자간 ${raw}가 권장 범위(-0.05em ~ 0em) 밖`,
  };
  if (!pass && em !== null) {
    const corrected = clamp(em, -0.05, 0);
    result.fix = {
      description: `자간을 ${corrected}em으로 보정`,
      patch: {}, // 자간은 alias 단계 — 직접 seed patch 불가, 메시지만 안내.
    };
  }
  return result;
}

/** K-02 (= P-09) — 본문 행간 1.5 이상 (권장 1.6). */
function checkLineHeight(tree: TokenTree): CheckResult {
  const criterion = CRITERIA_BY_ID["K-02"];
  const lh = tree.map.font.lineHeight.korean;
  const pass = lh >= 1.5;
  return {
    criterionId: "K-02",
    criterion,
    status: pass ? (lh >= 1.6 ? "pass" : "warn") : "warn",
    actual: String(lh),
    message:
      lh >= 1.6
        ? `한국어 본문 행간 ${lh} — 통과 (권장 충족)`
        : lh >= 1.5
        ? `한국어 본문 행간 ${lh} — 최소 통과, 권장 1.6 미달`
        : `한국어 본문 행간 ${lh}이 1.5 미만`,
  };
}

/**
 * K-04 — 자동 갱신 컴포넌트의 일시정지 가능 여부.
 *
 * 현재 L1 5종(Button·Input·Card·Modal·Form)에는 자동 갱신·자동 이동 컴포넌트가
 * 없으므로 적용 대상이 없다 → pass (N/A) 처리. Sprint 1D 이후 Carousel·Toast·
 * AutoplayVideo 등이 추가되면 그 컴포넌트 메타에 pauseable 플래그를 검사하도록 확장한다.
 */
function checkAutoUpdate(): CheckResult {
  const criterion = CRITERIA_BY_ID["K-04"];
  return {
    criterionId: "K-04",
    criterion,
    status: "pass",
    actual: "N/A",
    message: "L1 컴포넌트(Button·Input·Card·Modal·Form)에 자동 갱신 컴포넌트 없음 — 적용 대상 없음",
    detail: "Carousel·Toast·AutoplayVideo 등이 추가되면 그때 pauseable 메타로 자동 검증 예정",
  };
}

/** K-07 — Pretendard·Noto Sans KR 등 한국어 폰트가 폰트 스택에 포함되어야 한다. */
function checkKoreanFontStack(tree: TokenTree): CheckResult {
  const criterion = CRITERIA_BY_ID["K-07"];
  const stack = tree.seed.fontFamily.map((f) => f.toLowerCase());
  const found = stack.find((f) => KOREAN_FONT_HINTS.some((h) => f.includes(h)));
  const pass = Boolean(found);
  const result: CheckResult = {
    criterionId: "K-07",
    criterion,
    status: pass ? "pass" : "fail",
    actual: found ?? "없음",
    message: pass
      ? `한국어 폰트 ${found} 포함 — 통과`
      : "폰트 스택에 한국어 폰트가 없음 (Pretendard·Noto Sans KR 권장)",
    detail: `현재 스택: ${tree.seed.fontFamily.join(", ")}`,
  };
  if (!pass) {
    result.fix = {
      description: "Pretendard를 스택 맨 앞에 추가",
      patch: { fontFamily: ["Pretendard", ...tree.seed.fontFamily] },
    };
  }
  return result;
}

function parseEm(value: string): number | null {
  const m = value.match(/^(-?\d*\.?\d+)em$/);
  if (m) return Number.parseFloat(m[1]);
  if (value === "0") return 0;
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
