/**
 * Token Schema §2 흐름의 구현 — Seed → Map → Alias → TokenTree.
 *
 * 디자이너가 Seed를 변경할 때마다 본 함수가 다시 실행되어 Map·Alias가 재계산된다.
 */

import {
  generateColorScale,
  generateSemanticStates,
} from "./algorithms/oklch";
import {
  generateFontScale,
  generateRadiusScale,
  generateSizeScale,
} from "./algorithms/scales";
import { GENERATOR_VERSION } from "../version";
import type {
  AliasTokens,
  ColorScale,
  MapTokens,
  SemanticColor,
  SemanticStateMap,
  SeedTokens,
  StylePreset,
  TokenTree,
} from "./types";

/**
 * Seed의 시맨틱 색 5개 + neutral의 6개 색에 대해 11단 스케일을 생성한다.
 * neutral은 textBase의 색조를 차용 (보통 무채색이거나 약한 한기·온기를 띤다).
 */
function buildColorMap(seed: SeedTokens): MapTokens["color"] {
  const sources: Record<SemanticColor, string> = {
    primary: seed.color.primary,
    success: seed.color.success,
    warning: seed.color.warning,
    error: seed.color.error,
    info: seed.color.info,
    neutral: seed.color.textBase,
  };

  const out = {} as MapTokens["color"];
  for (const key of Object.keys(sources) as SemanticColor[]) {
    const scale: ColorScale = generateColorScale(sources[key]);
    const states: SemanticStateMap = generateSemanticStates(scale);
    out[key] = { ...scale, ...states };
  }
  return out;
}

/**
 * Token Schema §2.3 — 기본 Alias 매핑.
 * 디자이너가 변경하지 않으면 이 매핑이 사용된다. 모든 값은 *Map 단계의 키 경로*.
 *
 * seed: focusRingColorStep만 alias 결과에 영향을 준다 — primary 스케일 중 어느 단계를
 * 포커스 링 색으로 쓸지 결정한다 (Accessibility Spec §5.2 O-03 보정 경로).
 */
function buildDefaultAlias(seed: SeedTokens): AliasTokens {
  // alias의 "brand 색을 따라가는 3종"(action.primary, text.link, focus.ring.color)은
  // 동일 패턴을 따른다: 사용자가 step 오버라이드를 두지 않으면 seed.color.primary를
  // 직접 사용해 picker의 색이 곧 그 자리에 그대로 보이게 한다. 오버라이드가 있으면
  // map 스케일의 해당 단계로 전환 (대비 보정 경로).
  const actionPrimary = seed.actionPrimaryStep
    ? `{map.color.primary.${seed.actionPrimaryStep}}`
    : `{seed.color.primary}`;
  const actionDanger = seed.actionDangerStep
    ? `{map.color.error.${seed.actionDangerStep}}`
    : `{seed.color.error}`;
  const linkColor = `{seed.color.primary}`;
  const focusRingColor = seed.focusRingColorStep
    ? `{map.color.primary.${seed.focusRingColorStep}}`
    : `{seed.color.primary}`;
  return {
    text: {
      body: "{map.color.neutral.900}",
      heading: "{map.color.neutral.950}",
      caption: "{map.color.neutral.600}",
      disabled: "{map.color.neutral.400}",
      link: linkColor,
      onPrimary: seed.onPrimaryColor ? "{seed.onPrimaryColor}" : "{map.color.neutral.50}",
      onDanger: seed.onDangerColor ? "{seed.onDangerColor}" : "{map.color.neutral.50}",
    },
    surface: {
      base: "{map.color.neutral.50}",
      elevated: "{map.color.neutral.50}",
      muted: "{map.color.neutral.100}",
    },
    border: {
      subtle: "{map.color.neutral.200}",
      default: "{map.color.neutral.300}",
      strong: "{map.color.neutral.500}",
    },
    action: {
      primary: actionPrimary,
      danger: actionDanger,
    },
    feedback: {
      success: "{map.color.success.default}",
      warning: "{map.color.warning.default}",
      error: "{map.color.error.default}",
      info: "{map.color.info.default}",
    },
    control: {
      height: { sm: 24, md: 32, lg: 40 },
      padding: { x: 12 },
    },
    focus: {
      ring: {
        width: 2,
        color: focusRingColor,
        offset: 2,
      },
    },
  };
}

export function generateTokenTree(preset: StylePreset): TokenTree {
  const seed = preset.seed;
  const map: MapTokens = {
    color: buildColorMap(seed),
    size: generateSizeScale(seed.spacingBase),
    radius: generateRadiusScale(seed.borderRadius),
    font: generateFontScale(seed),
  };
  return {
    seed,
    map,
    alias: buildDefaultAlias(seed),
    meta: {
      presetId: preset.id,
      generatorVersion: GENERATOR_VERSION,
      derivedAt: new Date().toISOString(),
    },
  };
}

/**
 * Token Schema §2.3 — Alias 토큰의 참조 문자열을 실제 색 값으로 해석.
 * 예: "{map.color.primary.default}" → "oklch(0.55 0.18 250)"
 */
export function resolveTokenRef(ref: string, tree: TokenTree): string {
  const match = ref.match(/^\{([^}]+)\}$/);
  if (!match) return ref;
  const path = match[1].split(".");
  let cursor: unknown = tree;
  for (const segment of path) {
    if (cursor && typeof cursor === "object" && segment in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[segment];
    } else {
      return ref;
    }
  }
  return typeof cursor === "string" || typeof cursor === "number"
    ? String(cursor)
    : ref;
}
