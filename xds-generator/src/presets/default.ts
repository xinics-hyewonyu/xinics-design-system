/**
 * Style Preset Catalog §3.1 — Default 프리셋 (회사 표준, Ant Design 5.0 풍).
 * 모든 자식 프리셋은 본 프리셋을 1단계 extend 한다.
 */

import type { StylePreset } from "../tokens/types";

export const defaultPreset: StylePreset = {
  $schema: "https://xds.xinics.com/schemas/preset-v1.json",
  id: "default",
  name: "기본",
  version: "1.0.0",
  inspiration: "Ant Design 5.0 + 자체 보강",
  useCases: {
    recommended: ["admin", "lms", "ai", "b2c"],
    avoid: [],
  },
  seed: {
    color: {
      // L=0.50 — 흰 라벨(onPrimary) 대비 4.5:1을 직접 통과하는 톤. 사용자가 Primary Color
      // picker로 고른 색이 버튼 배경에 그대로 보이도록 alias가 seed를 직접 참조한다
      // (build.ts buildDefaultAlias 참고).
      primary: "oklch(0.50 0.18 250)",
      success: "oklch(0.65 0.17 145)",
      warning: "oklch(0.78 0.15 75)",
      error: "oklch(0.50 0.22 25)",
      info: "oklch(0.55 0.18 250)",
      bgBase: "oklch(1 0 0)",
      textBase: "oklch(0.15 0 0)",
    },
    borderRadius: 6,
    fontSize: 14,
    fontFamily: ["Pretendard", "system-ui", "sans-serif"],
    spacingBase: 4,
    density: "default",
    wireframe: false,
    // actionPrimaryStep / actionDangerStep은 기본적으로 비워둔다 → seed 색이 곧 버튼 색.
    // 사용자가 밝은 Primary를 골랐을 때 엔진이 대비 미달을 잡아 step 보정을 제안한다.
  },
  surface: {
    elevation: "minimal",
    borderStyle: "1px solid",
    shadowStyle: "0 1px 2px rgba(0,0,0,0.03)",
  },
  components: {
    Button: {
      primary: {
        bg: "{alias.action.primary}",
        text: "{alias.text.onPrimary}",
        border: "none",
        radius: 6,
      },
      danger: {
        bg: "{alias.action.danger}",
        text: "{alias.text.onDanger}",
        border: "none",
        radius: 6,
      },
      default: {
        bg: "{alias.surface.elevated}",
        text: "{alias.text.body}",
        border: "1px solid {alias.border.default}",
        radius: 6,
      },
      dashed: {
        bg: "{alias.surface.elevated}",
        text: "{alias.text.body}",
        border: "1px dashed {alias.border.default}",
        radius: 6,
      },
    },
    Card: {
      border: "1px solid {alias.border.subtle}",
      shadow: "0 1px 2px rgba(0,0,0,0.03)",
    },
    Input: {
      border: "1px solid {alias.border.default}",
      ringOnFocus: "2px solid {alias.focus.ring.color}",
    },
  },
  accessibility: {
    minContrast: 4.5,
    focusRingMinWidth: 2,
    touchTargetMinSize: 44,
  },
};
