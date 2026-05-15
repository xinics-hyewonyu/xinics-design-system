/**
 * Token Schema §2.2.3 ~ §2.2.5 — 사이즈·반경·타이포 스케일 알고리즘.
 *
 * Seed의 단일 베이스값에서 결정적 비율로 각 스케일을 파생한다.
 */

import type { MapTokens, SeedTokens } from "../types";

export function generateSizeScale(spacingBase: number): MapTokens["size"] {
  const b = spacingBase;
  return {
    xxs: b * 1,
    xs: b * 2,
    sm: b * 3,
    md: b * 4,
    lg: b * 5,
    xl: b * 6,
    xxl: b * 8,
    xxxl: b * 12,
  };
}

export function generateRadiusScale(borderRadius: number): MapTokens["radius"] {
  const b = borderRadius;
  return {
    none: 0,
    xs: Math.round(b * 0.33),
    sm: Math.round(b * 0.67),
    md: b,
    lg: Math.round(b * 1.33),
    xl: b * 2,
    full: 9999,
  };
}

export function generateFontScale(seed: SeedTokens): MapTokens["font"] {
  const base = seed.fontSize;
  return {
    size: {
      xs: Math.round(base * 0.857),
      sm: base,
      md: Math.round(base * 1.143),
      lg: Math.round(base * 1.286),
      xl: Math.round(base * 1.429),
      xxl: Math.round(base * 1.714),
      xxxl: Math.round(base * 2.286),
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      loose: 1.75,
      korean: 1.6,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      korean: "-0.01em",
    },
  };
}
