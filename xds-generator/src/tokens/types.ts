/**
 * Token Schema §1~§3 — W3C Design Tokens 포맷 + Seed/Map/Alias 3계층.
 *
 * 토큰 1개의 기본 형태:
 *   { $value, $type, $description?, $extensions? }
 *
 * 모든 컴포넌트 명세는 Alias만 참조한다 (Token Schema §2.3 strict-tokens).
 */

export type SemanticColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export const SEMANTIC_COLORS: readonly SemanticColor[] = [
  "primary",
  "success",
  "warning",
  "error",
  "info",
  "neutral",
] as const;

export type ColorScaleStep =
  | "50"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | "950";

export const COLOR_SCALE_STEPS: readonly ColorScaleStep[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

/** Token Schema §2.2.2 — 시맨틱 색 상태 변형 명명 */
export type SemanticState =
  | "bg"
  | "bgHover"
  | "border"
  | "borderHover"
  | "hover"
  | "default"
  | "active"
  | "text"
  | "textHover"
  | "textActive";

export type Density = "compact" | "default" | "comfortable";

export type W3CType =
  | "color"
  | "dimension"
  | "fontFamily"
  | "fontWeight"
  | "number"
  | "duration"
  | "cubicBezier"
  | "shadow"
  | "xds.elevation"
  | "xds.density"
  | "xds.zIndex"
  | "boolean";

export type TokenSource = "algorithm" | "manual" | "imported";

export interface W3CToken<V = string | number> {
  $value: V | ConditionalValue<V>;
  $type: W3CType;
  $description?: string;
  $extensions?: {
    "xds.derived"?: boolean;
    "xds.locked"?: boolean;
    "xds.source"?: TokenSource;
    "xds.experimental"?: boolean;
    "xds.lockedReason"?: string;
  };
}

/** Token Schema §4 — 다크모드·다국어 조건 분기 */
export interface ConditionalValue<V> {
  default: V;
  _dark?: V;
  _dark_locked?: boolean;
  [localeKey: `_locale_${string}`]: V | undefined;
}

/** Token Schema §2.1 — Seed 토큰 13종 */
export interface SeedTokens {
  color: {
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    bgBase: string;
    textBase: string;
  };
  borderRadius: number;
  fontSize: number;
  fontFamily: string[];
  spacingBase: number;
  density: Density;
  wireframe: boolean;
  /**
   * 포커스 링 색이 참조할 primary 스케일 단계.
   * 생략 시 "400". O-03 대비 미달 시 자동 보정이 더 어두운 단계를 제안한다.
   */
  focusRingColorStep?: ColorScaleStep;
  /**
   * `alias.action.primary`가 참조할 primary 스케일 단계.
   * 생략 시 "500" (semantic .default). 사용자가 Primary Hue를 밝게 잡았을 때
   * onPrimary(흰색) 라벨 대비가 4.5 미달이면 자동 보정이 더 어두운 단계를 제안.
   */
  actionPrimaryStep?: ColorScaleStep;
  /** `alias.action.danger`가 참조할 error 스케일 단계. 동일 규칙. 생략 시 "500". */
  actionDangerStep?: ColorScaleStep;
  /**
   * Primary 버튼 라벨 색 (alias.text.onPrimary). 생략 시 흰색에 가까운 neutral.50.
   * 사용자가 밝은 Primary 배경을 골랐다면 어두운 라벨 색을 직접 지정하는 게 자연스럽다.
   */
  onPrimaryColor?: string;
  /** Danger 버튼 라벨 색 (alias.text.onDanger). 생략 시 neutral.50. */
  onDangerColor?: string;
}

export type ColorScale = Record<ColorScaleStep, string>;
export type SemanticStateMap = Record<SemanticState, string>;

/** Token Schema §2.2 — Map 토큰 (Seed에서 자동 파생) */
export interface MapTokens {
  color: Record<SemanticColor, ColorScale & SemanticStateMap>;
  size: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  radius: {
    none: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  font: {
    size: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      loose: number;
      korean: number;
    };
    letterSpacing: {
      tight: string;
      normal: string;
      korean: string;
    };
  };
}

/** Token Schema §2.3 — Alias 토큰 (컴포넌트가 참조) */
export interface AliasTokens {
  text: {
    body: string;
    heading: string;
    caption: string;
    disabled: string;
    link: string;
    onPrimary: string;
    onDanger: string;
  };
  surface: {
    base: string;
    elevated: string;
    muted: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
  };
  action: {
    primary: string;
    danger: string;
  };
  feedback: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  control: {
    height: { sm: number; md: number; lg: number };
    padding: { x: number };
  };
  focus: {
    ring: {
      width: number;
      color: string;
      offset: number;
    };
  };
}

export interface TokenTree {
  seed: SeedTokens;
  map: MapTokens;
  alias: AliasTokens;
  meta: {
    presetId: string;
    generatorVersion: string;
    derivedAt: string;
  };
}

/** Style Preset Catalog §2 — 프리셋 JSON 스키마 */
export interface StylePreset {
  $schema?: string;
  id: string;
  name: string;
  version: string;
  extends?: string;
  inspiration?: string;
  useCases?: {
    recommended?: string[];
    avoid?: string[];
  };
  seed: SeedTokens;
  surface?: Record<string, string | number | null>;
  components?: Record<string, unknown>;
  accessibility?: {
    minContrast?: number;
    focusRingMinWidth?: number;
    touchTargetMinSize?: number;
  };
}
