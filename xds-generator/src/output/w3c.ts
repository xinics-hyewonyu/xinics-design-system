/**
 * Output Spec §5.1 — W3C Design Tokens 통합 JSON 시리얼라이저.
 *
 * TokenTree → Design Tokens Community Group Format으로 변환.
 * 입력 검증을 위한 reverse parser도 함께 제공.
 */

import {
  COLOR_SCALE_STEPS,
  SEMANTIC_COLORS,
  type SemanticColor,
  type SemanticState,
  type TokenTree,
  type W3CToken,
} from "../tokens/types";
import { GENERATOR_VERSION } from "../version";

const SEMANTIC_STATES: SemanticState[] = [
  "bg",
  "bgHover",
  "border",
  "borderHover",
  "hover",
  "default",
  "active",
  "text",
  "textHover",
  "textActive",
];

export interface W3CTokensDocument {
  $schema: string;
  $metadata: {
    name: string;
    version: string;
    generatorVersion: string;
    derivedAt: string;
  };
  seed: Record<string, unknown>;
  map: Record<string, unknown>;
  alias: Record<string, unknown>;
}

export interface W3CSerializeOptions {
  projectName?: string;
  projectVersion?: string;
}

/** TokenTree → W3C 표준 단일 JSON 문서. Output Spec §5.1 양식. */
export function tokenTreeToW3C(
  tree: TokenTree,
  opts: W3CSerializeOptions = {},
): W3CTokensDocument {
  return {
    $schema: "https://design-tokens.github.io/community-group/format/",
    $metadata: {
      name: opts.projectName ?? tree.meta.presetId,
      version: opts.projectVersion ?? "1.0.0",
      generatorVersion: GENERATOR_VERSION,
      derivedAt: tree.meta.derivedAt,
    },
    seed: seedToW3C(tree),
    map: mapToW3C(tree),
    alias: aliasToW3C(tree),
  };
}

function token<V>(
  value: V,
  type: W3CToken["$type"],
  description?: string,
  derived = false,
): W3CToken<V> {
  return {
    $value: value,
    $type: type,
    ...(description ? { $description: description } : {}),
    ...(derived
      ? { $extensions: { "xds.derived": true, "xds.source": "algorithm" } }
      : {}),
  };
}

function seedToW3C(tree: TokenTree): Record<string, unknown> {
  const s = tree.seed;
  const base: Record<string, unknown> = {
    color: {
      primary: token(s.color.primary, "color", "주요 액션·강조 색상"),
      success: token(s.color.success, "color", "성공·완료"),
      warning: token(s.color.warning, "color", "주의"),
      error: token(s.color.error, "color", "위험·오류"),
      info: token(s.color.info, "color", "정보"),
      bgBase: token(s.color.bgBase, "color", "페이지 배경"),
      textBase: token(s.color.textBase, "color", "본문 텍스트"),
    },
    borderRadius: token(`${s.borderRadius}px`, "dimension", "모서리 반경 기본"),
    fontSize: token(`${s.fontSize}px`, "dimension", "본문 기본 크기"),
    fontFamily: token(s.fontFamily, "fontFamily", "본문 폰트 스택"),
    spacingBase: token(`${s.spacingBase}px`, "dimension", "spacing 스케일 단위"),
    density: token(s.density, "xds.density", "데이터 밀도"),
    wireframe: token(s.wireframe, "boolean", "와이어프레임 모드"),
  };
  // 선택적 alias 보정용 필드 — round-trip 보존을 위해 정의된 경우에만 emit.
  if (s.onPrimaryColor) base.onPrimaryColor = token(s.onPrimaryColor, "color", "Primary 라벨 색 직접 지정");
  if (s.onDangerColor) base.onDangerColor = token(s.onDangerColor, "color", "Danger 라벨 색 직접 지정");
  if (s.focusRingColorStep) {
    base.focusRingColorStep = token(s.focusRingColorStep, "number", "포커스 링 색 스케일 단계");
  }
  if (s.actionPrimaryStep) {
    base.actionPrimaryStep = token(s.actionPrimaryStep, "number", "Primary 액션 배경 스케일 단계");
  }
  if (s.actionDangerStep) {
    base.actionDangerStep = token(s.actionDangerStep, "number", "Danger 액션 배경 스케일 단계");
  }
  return base;
}

function mapToW3C(tree: TokenTree): Record<string, unknown> {
  const colorOut: Record<SemanticColor, Record<string, unknown>> = {
    primary: {},
    success: {},
    warning: {},
    error: {},
    info: {},
    neutral: {},
  };
  for (const color of SEMANTIC_COLORS) {
    const group: Record<string, W3CToken> = {};
    for (const step of COLOR_SCALE_STEPS) {
      group[step] = token(tree.map.color[color][step], "color", undefined, true);
    }
    for (const state of SEMANTIC_STATES) {
      group[state] = token(tree.map.color[color][state], "color", undefined, true);
    }
    colorOut[color] = group;
  }

  return {
    color: colorOut,
    size: mapNumberGroup(tree.map.size),
    radius: mapNumberGroup(tree.map.radius),
    font: {
      size: mapNumberGroup(tree.map.font.size),
      lineHeight: Object.fromEntries(
        Object.entries(tree.map.font.lineHeight).map(([k, v]) => [
          k,
          token(v, "number"),
        ]),
      ),
      letterSpacing: Object.fromEntries(
        Object.entries(tree.map.font.letterSpacing).map(([k, v]) => [
          k,
          token(v, "dimension"),
        ]),
      ),
    },
  };
}

function mapNumberGroup(input: Record<string, number>): Record<string, W3CToken> {
  const out: Record<string, W3CToken> = {};
  for (const [k, v] of Object.entries(input)) {
    out[k] = token(`${v}px`, "dimension");
  }
  return out;
}

function aliasToW3C(tree: TokenTree): Record<string, unknown> {
  return {
    text: refGroup(tree.alias.text, "본문·헤더·캡션 등 의미 텍스트"),
    surface: refGroup(tree.alias.surface, "페이지·카드 등 표면"),
    border: refGroup(tree.alias.border, "경계선 강도"),
    action: refGroup(tree.alias.action, "주요 액션·위험 액션"),
    feedback: refGroup(tree.alias.feedback, "상태 색"),
    control: {
      height: {
        sm: token(`${tree.alias.control.height.sm}px`, "dimension"),
        md: token(`${tree.alias.control.height.md}px`, "dimension"),
        lg: token(`${tree.alias.control.height.lg}px`, "dimension"),
      },
      padding: {
        x: token(`${tree.alias.control.padding.x}px`, "dimension"),
      },
    },
    focus: {
      ring: {
        width: token(`${tree.alias.focus.ring.width}px`, "dimension"),
        color: token(tree.alias.focus.ring.color, "color"),
        offset: token(`${tree.alias.focus.ring.offset}px`, "dimension"),
      },
    },
  };
}

function refGroup(
  group: Record<string, string>,
  groupDescription?: string,
): Record<string, W3CToken<string>> {
  const out: Record<string, W3CToken<string>> = {};
  for (const [k, v] of Object.entries(group)) {
    out[k] = token(v, "color", groupDescription);
  }
  return out;
}

/**
 * W3C 표준 JSON을 다시 파싱 (외부 import 호환).
 * v0.1 범위에서는 *Seed만* 다시 읽어 들이는 부분 파서. Map은 알고리즘 재생성을 권장.
 */
export function parseSeedFromW3C(doc: unknown): TokenTree["seed"] | null {
  if (!doc || typeof doc !== "object") return null;
  const seedSection = (doc as Record<string, unknown>).seed;
  if (!seedSection || typeof seedSection !== "object") return null;

  const pick = (key: string): unknown =>
    (seedSection as Record<string, unknown>)[key];

  const colorSection = pick("color");
  if (!colorSection || typeof colorSection !== "object") return null;
  const colorAt = (k: string): string =>
    String(
      ((colorSection as Record<string, W3CToken>)[k] ?? {}).$value ?? "",
    );

  const dimAt = (k: string): number => {
    const raw = (pick(k) as W3CToken | undefined)?.$value;
    if (typeof raw !== "string") return 0;
    return Number(raw.replace(/px$/, "")) || 0;
  };

  const fontFamily =
    (pick("fontFamily") as W3CToken<string[]> | undefined)?.$value ?? [];

  const density =
    ((pick("density") as W3CToken | undefined)?.$value as TokenTree["seed"]["density"]) ??
    "default";

  const wireframe = Boolean(
    (pick("wireframe") as W3CToken | undefined)?.$value ?? false,
  );

  const optionalStr = (k: string): string | undefined => {
    const raw = (pick(k) as W3CToken | undefined)?.$value;
    return typeof raw === "string" && raw.length > 0 ? raw : undefined;
  };

  return {
    color: {
      primary: colorAt("primary"),
      success: colorAt("success"),
      warning: colorAt("warning"),
      error: colorAt("error"),
      info: colorAt("info"),
      bgBase: colorAt("bgBase"),
      textBase: colorAt("textBase"),
    },
    borderRadius: dimAt("borderRadius"),
    fontSize: dimAt("fontSize"),
    fontFamily: Array.isArray(fontFamily) ? fontFamily : [],
    spacingBase: dimAt("spacingBase"),
    density,
    wireframe,
    onPrimaryColor: optionalStr("onPrimaryColor"),
    onDangerColor: optionalStr("onDangerColor"),
    focusRingColorStep: optionalStr("focusRingColorStep") as
      | TokenTree["seed"]["focusRingColorStep"]
      | undefined,
    actionPrimaryStep: optionalStr("actionPrimaryStep") as
      | TokenTree["seed"]["actionPrimaryStep"]
      | undefined,
    actionDangerStep: optionalStr("actionDangerStep") as
      | TokenTree["seed"]["actionDangerStep"]
      | undefined,
  };
}
