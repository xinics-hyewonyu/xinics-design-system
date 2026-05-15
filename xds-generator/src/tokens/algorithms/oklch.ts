/**
 * OKLCH 색공간 유틸 — Token Schema §2.2.1 색상 11단 스케일 자동 파생 알고리즘.
 *
 * 입력: 임의 색 문자열 (oklch / hex / rgb)
 * 출력: 11단 색상 스케일 + 4단 시맨틱 상태 변형 + 다크모드 파생값
 *
 * 의존: culori (OKLCH·변환·gamut mapping)
 */

import {
  parse as culoriParse,
  formatHex,
  formatCss,
  oklch,
  converter,
  type Oklch,
} from "culori";
import type { ColorScale, ColorScaleStep, SemanticStateMap } from "../types";

const toOklch = converter("oklch");

/**
 * Token Schema §2.2.1 — 11단 명도 분포.
 *
 * 디자이너의 Seed가 어떤 명도이든 그 색의 색조(H)·채도(C)를 유지하면서
 * 명도(L)를 0.97 → 0.10까지 11단으로 분포시킨다. Seed에 가장 가까운 단계는 500.
 */
const LIGHTNESS_STEPS: Record<ColorScaleStep, number> = {
  "50": 0.97,
  "100": 0.93,
  "200": 0.87,
  "300": 0.78,
  "400": 0.68,
  "500": 0.58,
  "600": 0.5,
  "700": 0.42,
  "800": 0.32,
  "900": 0.22,
  "950": 0.13,
};

/**
 * Token Schema §2.2.1 — "양 끝에서 점진 감소, 200~800에서 최대" 채도 곡선.
 * 명도가 0.5~0.6 근처에서 채도가 가장 잘 보존되는 OKLCH 특성을 반영.
 */
const CHROMA_FACTOR: Record<ColorScaleStep, number> = {
  "50": 0.25,
  "100": 0.45,
  "200": 0.7,
  "300": 0.85,
  "400": 0.95,
  "500": 1.0,
  "600": 1.0,
  "700": 0.95,
  "800": 0.85,
  "900": 0.7,
  "950": 0.55,
};

export interface ParsedOklch {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

/** 입력 문자열을 OKLCH로 변환. 실패 시 null. */
export function parseColor(input: string): ParsedOklch | null {
  const parsed = culoriParse(input);
  if (!parsed) return null;
  const lch = toOklch(parsed) as Oklch | undefined;
  if (!lch) return null;
  return {
    l: lch.l ?? 0,
    c: lch.c ?? 0,
    h: lch.h ?? 0,
    alpha: lch.alpha ?? 1,
  };
}

/** OKLCH 좌표 → CSS oklch() 문자열. 소수 3자리 반올림. */
export function formatOklch({ l, c, h, alpha }: ParsedOklch): string {
  const L = round(l, 3);
  const C = round(c, 4);
  const H = round(h, 2);
  const A = round(alpha, 3);
  return A < 1
    ? `oklch(${L} ${C} ${H} / ${A})`
    : `oklch(${L} ${C} ${H})`;
}

/** 디버깅·외부 도구 호환용 HEX 폴백. sRGB gamut clamp는 culori가 처리. */
export function toHex(input: string): string | null {
  const parsed = culoriParse(input);
  if (!parsed) return null;
  return formatHex(parsed) ?? null;
}

/**
 * 11단 색상 스케일 생성 — Token Schema §2.2.1.
 *
 * Seed 색의 색조(H)와 채도 최댓값(C)을 기준으로 각 단계의 명도·채도를 계산.
 * 50~100단계는 H를 약간 끌어올려 인지적 자연스러움 보강 (옵션).
 */
export function generateColorScale(seedColor: string): ColorScale {
  const parsed = parseColor(seedColor);
  if (!parsed) {
    throw new Error(`Cannot parse color for scale generation: ${seedColor}`);
  }
  const { c: baseChroma, h: baseHue } = parsed;
  const scale = {} as ColorScale;
  for (const step of Object.keys(LIGHTNESS_STEPS) as ColorScaleStep[]) {
    const l = LIGHTNESS_STEPS[step];
    const c = baseChroma * CHROMA_FACTOR[step];
    scale[step] = formatOklch({ l, c, h: baseHue, alpha: 1 });
  }
  return scale;
}

/**
 * 4단 상태 변형 — Token Schema §2.2.2.
 * 11단 스케일에서 의미 단계로 매핑.
 */
export function generateSemanticStates(scale: ColorScale): SemanticStateMap {
  return {
    bg: scale["50"],
    bgHover: scale["100"],
    border: scale["200"],
    borderHover: scale["300"],
    hover: scale["400"],
    default: scale["500"],
    active: scale["600"],
    text: scale["700"],
    textHover: scale["600"],
    textActive: scale["800"],
  };
}

/**
 * Token Schema §4.1 — 다크모드 자동 파생.
 *
 * L(명도) 반전: 0.95 ↔ 0.15, 0.85 ↔ 0.25, ...
 * C(채도) 약간 감소 (다크에서 과포화 방지)
 * H(색조) 유지
 *
 * 디자이너의 수동 override(`_dark_locked`)는 상위 레벨에서 처리.
 */
export function deriveDark(lightColor: string): string {
  const parsed = parseColor(lightColor);
  if (!parsed) {
    throw new Error(`Cannot parse color for dark derivation: ${lightColor}`);
  }
  const { l, c, h, alpha } = parsed;
  return formatOklch({
    l: clamp(1 - l, 0.05, 0.97),
    c: c * 0.85,
    h,
    alpha,
  });
}

/** WCAG 2.2 명도 대비비 계산. 두 색의 상대 휘도(Y)에서 (Y1 + 0.05) / (Y2 + 0.05). */
export function contrastRatio(a: string, b: string): number {
  const ya = relativeLuminance(a);
  const yb = relativeLuminance(b);
  const [hi, lo] = ya > yb ? [ya, yb] : [yb, ya];
  return round((hi + 0.05) / (lo + 0.05), 3);
}

/** Token Schema §1.2 — 색이 WCAG/KWCAG 본문 4.5:1을 통과하는지. */
export function passesBodyContrast(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5;
}

/** UI 컴포넌트·대형 텍스트·아이콘 3:1. */
export function passesLargeOrUiContrast(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 3;
}

function relativeLuminance(color: string): number {
  const parsed = culoriParse(color);
  if (!parsed) return 0;
  const rgb = converter("rgb")(parsed) as { r: number; g: number; b: number } | undefined;
  if (!rgb) return 0;
  const lin = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function round(n: number, digits: number): number {
  const mul = 10 ** digits;
  return Math.round(n * mul) / mul;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** 디버그/시리얼라이즈용 — culori 표현으로 변환. */
export function asCss(input: string): string {
  const parsed = culoriParse(input);
  return parsed ? (formatCss(parsed) ?? input) : input;
}

/** 외부에서 OKLCH 좌표 직접 합성이 필요한 경우. */
export function makeOklch(l: number, c: number, h: number, alpha = 1): string {
  return formatOklch({ l, c, h, alpha });
}

export const oklchInternal = { oklch, toOklch };
