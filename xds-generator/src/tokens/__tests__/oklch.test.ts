/**
 * OKLCH 유틸 단위 테스트 — Sprint 1A 검증.
 *
 * Token Schema §2.2.1·§2.2.2·§4.1, Accessibility Spec P-01 (대비비 ≥ 4.5)
 * 핵심 동작이 회귀하지 않도록 보장한다.
 */

import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  deriveDark,
  generateColorScale,
  generateSemanticStates,
  parseColor,
  passesBodyContrast,
} from "../algorithms/oklch";

describe("parseColor", () => {
  it("oklch 입력을 파싱한다", () => {
    const c = parseColor("oklch(0.55 0.18 250)");
    expect(c).not.toBeNull();
    expect(c!.l).toBeCloseTo(0.55, 2);
  });

  it("hex 입력을 OKLCH로 변환한다", () => {
    const c = parseColor("#1677FF");
    expect(c).not.toBeNull();
    expect(c!.l).toBeGreaterThan(0);
    expect(c!.l).toBeLessThan(1);
  });

  it("파싱 실패 시 null", () => {
    expect(parseColor("not-a-color")).toBeNull();
  });
});

describe("generateColorScale", () => {
  it("11단 모두 생성된다", () => {
    const scale = generateColorScale("oklch(0.55 0.18 250)");
    const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    for (const s of steps) {
      expect(scale[s as keyof typeof scale]).toMatch(/^oklch\(/);
    }
  });

  it("50은 950보다 밝다", () => {
    const scale = generateColorScale("oklch(0.55 0.18 250)");
    const l50 = parseColor(scale["50"])!.l;
    const l950 = parseColor(scale["950"])!.l;
    expect(l50).toBeGreaterThan(l950);
  });

  it("색조(H)는 유지된다", () => {
    const scale = generateColorScale("oklch(0.55 0.18 250)");
    const h500 = parseColor(scale["500"])!.h;
    const h800 = parseColor(scale["800"])!.h;
    expect(Math.abs(h500 - h800)).toBeLessThan(1);
  });
});

describe("generateSemanticStates", () => {
  it("default가 가장 'standard'한 단계로 매핑된다", () => {
    const scale = generateColorScale("oklch(0.55 0.18 250)");
    const states = generateSemanticStates(scale);
    expect(states.default).toBe(scale["500"]);
    expect(states.hover).toBe(scale["400"]);
    expect(states.active).toBe(scale["600"]);
  });
});

describe("contrastRatio", () => {
  it("흰색 vs 검정 = 21", () => {
    const ratio = contrastRatio("oklch(1 0 0)", "oklch(0 0 0)");
    expect(ratio).toBeGreaterThan(20.5);
  });

  it("같은 색끼리는 1", () => {
    expect(contrastRatio("oklch(0.5 0 0)", "oklch(0.5 0 0)")).toBeCloseTo(1, 2);
  });

  it("Default 본문(neutral-900) vs 흰색이 WCAG AA 통과", () => {
    const scale = generateColorScale("oklch(0.15 0 0)");
    expect(passesBodyContrast(scale["900"], "oklch(1 0 0)")).toBe(true);
  });
});

describe("deriveDark", () => {
  it("밝은 배경이 어두운 배경으로 반전된다", () => {
    const dark = deriveDark("oklch(1 0 0)");
    const parsed = parseColor(dark)!;
    expect(parsed.l).toBeLessThan(0.3);
  });

  it("채도는 약간 감소한다", () => {
    const original = parseColor("oklch(0.55 0.20 250)")!;
    const dark = parseColor(deriveDark("oklch(0.55 0.20 250)"))!;
    expect(dark.c).toBeLessThan(original.c);
  });

  it("색조는 유지된다", () => {
    const dark = parseColor(deriveDark("oklch(0.55 0.20 250)"))!;
    expect(Math.abs(dark.h - 250)).toBeLessThan(1);
  });
});
