/**
 * UI Spec §4.4 — Customize Theme 패널.
 *
 * Quick Access (항상 노출): Primary Color · Border Radius · Density · Font Family
 * 고급 설정 (펼침): Seed 9종 전체 + Success/Warning/Error 시맨틱 색
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Field, SegmentedRadio, Select } from "../components/ui/Field";
import { OklchColorPicker } from "../components/ui/OklchColorPicker";
import { Slider } from "../components/ui/Slider";
import { useProjectStore } from "../store/projectStore";
import type { Project } from "../store/types";
import { defaultPreset } from "../presets/default";
import type { ColorScaleStep, Density, SeedTokens } from "../tokens/types";

const FONT_OPTIONS = [
  { label: "Pretendard", value: "pretendard" },
  { label: "Inter", value: "inter" },
  { label: "Roboto", value: "roboto" },
  { label: "Geist Sans", value: "geist" },
] as const;

const FONT_STACKS: Record<string, string[]> = {
  pretendard: ["Pretendard", "system-ui", "sans-serif"],
  inter: ["Inter", "Pretendard", "system-ui", "sans-serif"],
  roboto: ["Roboto", "Pretendard", "system-ui", "sans-serif"],
  geist: ["Geist Sans", "Inter", "Pretendard", "system-ui", "sans-serif"],
};

const DENSITY_OPTIONS = [
  { label: "Compact", value: "compact" as Density },
  { label: "Default", value: "default" as Density },
  { label: "Comfortable", value: "comfortable" as Density },
];

/**
 * Primary/Danger 액션 배경의 스케일 단계 선택지.
 * "auto"는 seed 색을 그대로 사용 (사용자가 고른 색이 곧 버튼 색). 그 외는 map 스케일의
 * 명시 단계로 강제 — 대비 보정용.
 */
const ACTION_STEP_OPTIONS: { label: string; value: string }[] = [
  { label: "자동 (Primary 색 그대로)", value: "auto" },
  { label: "300 — 밝게", value: "300" },
  { label: "400 — 약간 밝게", value: "400" },
  { label: "500 — 표준", value: "500" },
  { label: "600 — 약간 어둡게", value: "600" },
  { label: "700 — 어둡게", value: "700" },
  { label: "800 — 더 어둡게", value: "800" },
];

export function CustomizeTheme({ project }: { project: Project }) {
  const updateSeed = useProjectStore((s) => s.updateSeed);
  const updateSeedColor = useProjectStore((s) => s.updateSeedColor);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const seed: SeedTokens = {
    ...defaultPreset.seed,
    ...project.seedOverrides,
    color: { ...defaultPreset.seed.color, ...(project.seedOverrides.color ?? {}) },
  };

  const fontKey =
    Object.entries(FONT_STACKS).find(([, stack]) =>
      stack[0] === seed.fontFamily[0],
    )?.[0] ?? "pretendard";

  return (
    <div className="flex flex-col gap-4" aria-label="Customize Theme">
      <header>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--xds-tool-text-muted)" }}>
          Customize Theme
        </h2>
        <p className="text-[11px]" style={{ color: "var(--xds-tool-text-muted)" }}>
          Seed 토큰을 조정하면 Map·Alias가 자동 파생됩니다.
        </p>
      </header>

      <Field label="Primary Color">
        <OklchColorPicker
          value={seed.color.primary}
          onChange={(next) => updateSeedColor(project.id, "primary", next)}
        />
      </Field>

      <Field label="Border Radius">
        <Slider
          label="모서리 반경"
          value={seed.borderRadius}
          min={0}
          max={24}
          step={1}
          unit="px"
          onChange={(v) => updateSeed(project.id, { borderRadius: v })}
        />
      </Field>

      <Field label="Density">
        <SegmentedRadio
          value={seed.density}
          options={DENSITY_OPTIONS}
          onChange={(v) => updateSeed(project.id, { density: v })}
          ariaLabel="데이터 밀도"
        />
      </Field>

      <Field label="Font Family">
        <Select
          value={fontKey}
          options={FONT_OPTIONS}
          onChange={(v) => updateSeed(project.id, { fontFamily: FONT_STACKS[v] })}
          ariaLabel="본문 폰트"
        />
      </Field>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium pt-2"
        style={{
          color: "var(--xds-tool-text-muted)",
          borderTop: "1px solid var(--xds-tool-border)",
        }}
        aria-expanded={advancedOpen}
      >
        {advancedOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        고급 설정 (Seed 9종 전체)
      </button>

      {/* 시맨틱 색 인라인 편집을 위해 컴포넌트 함수 분리 — 토글된 키만 picker 노출. */}
      {advancedOpen ? (
        <div className="space-y-3 pl-1" aria-label="고급 Seed 토큰">
          <Field label="Font Size (본문 기본)">
            <Slider
              label="px"
              value={seed.fontSize}
              min={12}
              max={20}
              step={1}
              unit="px"
              onChange={(v) => updateSeed(project.id, { fontSize: v })}
            />
          </Field>

          <Field label="Spacing Base (4의 배수 권장)">
            <Slider
              label="px"
              value={seed.spacingBase}
              min={2}
              max={8}
              step={1}
              unit="px"
              onChange={(v) => updateSeed(project.id, { spacingBase: v })}
            />
          </Field>

          <ActionLabelSection
            kind="primary"
            seed={seed}
            onStepChange={(v) =>
              updateSeed(project.id, {
                actionPrimaryStep: v === "auto" ? undefined : (v as ColorScaleStep),
              })
            }
            onLabelColorChange={(next) => updateSeed(project.id, { onPrimaryColor: next })}
            onLabelColorReset={() => updateSeed(project.id, { onPrimaryColor: undefined })}
          />

          <ActionLabelSection
            kind="danger"
            seed={seed}
            onStepChange={(v) =>
              updateSeed(project.id, {
                actionDangerStep: v === "auto" ? undefined : (v as ColorScaleStep),
              })
            }
            onLabelColorChange={(next) => updateSeed(project.id, { onDangerColor: next })}
            onLabelColorReset={() => updateSeed(project.id, { onDangerColor: undefined })}
          />

          <SemanticColorRow
            seed={seed}
            onChange={(key, next) => updateSeedColor(project.id, key, next)}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Primary/Danger 버튼의 배경 단계 + 라벨 색을 한 묶음으로 노출.
 * 배경은 Select (auto/step), 라벨 색은 토글로 열리는 OklchColorPicker.
 */
function ActionLabelSection({
  kind,
  seed,
  onStepChange,
  onLabelColorChange,
  onLabelColorReset,
}: {
  kind: "primary" | "danger";
  seed: SeedTokens;
  onStepChange: (v: string) => void;
  onLabelColorChange: (next: string) => void;
  onLabelColorReset: () => void;
}) {
  const [labelOpen, setLabelOpen] = useState(false);
  const isPrimary = kind === "primary";
  const stepValue = isPrimary ? seed.actionPrimaryStep ?? "auto" : seed.actionDangerStep ?? "auto";
  const labelOverride = isPrimary ? seed.onPrimaryColor : seed.onDangerColor;
  const labelColorEffective = labelOverride ?? "oklch(0.97 0 0)"; // neutral.50 근사
  const title = isPrimary ? "Primary 버튼" : "Danger 버튼";
  const hint = isPrimary
    ? "배경은 Primary 색 그대로(기본). 대비 미달 시 단계 강제 가능"
    : "배경은 Error 색 그대로(기본). 채도 높은 빨강은 어두운 단계 필요할 수 있음";

  return (
    <div>
      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--xds-tool-text-muted)" }}>
        {title}
      </div>
      <div className="flex gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <Select
            value={stepValue}
            options={ACTION_STEP_OPTIONS}
            onChange={onStepChange}
            ariaLabel={`${title} 배경 단계`}
          />
        </div>
        <button
          type="button"
          onClick={() => setLabelOpen((v) => !v)}
          className="h-9 px-2 inline-flex items-center gap-1.5 rounded-md text-xs"
          style={{
            background: "var(--xds-tool-surface)",
            border: `1px solid ${labelOverride ? "var(--xds-tool-primary)" : "var(--xds-tool-border)"}`,
            color: "var(--xds-tool-text)",
          }}
          aria-expanded={labelOpen}
          aria-label={`${title} 라벨 색 ${labelOpen ? "접기" : "편집"}`}
          title={labelOverride ? `라벨 색 직접 지정: ${labelOverride}` : "라벨 색 기본값 (neutral.50)"}
        >
          <span
            className="size-4 rounded shrink-0"
            style={{ background: labelColorEffective, border: "1px solid var(--xds-tool-border)" }}
            aria-hidden
          />
          라벨
        </button>
      </div>
      <p className="text-[11px] mb-1.5" style={{ color: "var(--xds-tool-text-muted)" }}>
        {hint}
      </p>
      {labelOpen ? (
        <div className="pl-1 pb-1">
          <OklchColorPicker
            value={labelColorEffective}
            onChange={onLabelColorChange}
          />
          {labelOverride ? (
            <button
              type="button"
              onClick={onLabelColorReset}
              className="mt-1.5 text-[11px] font-medium underline"
              style={{ color: "var(--xds-tool-text-muted)" }}
            >
              기본값(neutral.50)으로 되돌리기
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type SemanticColorKey = "success" | "warning" | "error";

const SEMANTIC_COLOR_LABELS: Record<SemanticColorKey, string> = {
  success: "Success",
  warning: "Warning",
  error: "Error",
};

/**
 * 시맨틱 색 3종(Success/Warning/Error)을 한 줄 스와치 행으로 압축.
 * 클릭한 색만 picker 인라인 노출 — 패널 스크롤 절약.
 */
function SemanticColorRow({
  seed,
  onChange,
}: {
  seed: SeedTokens;
  onChange: (key: SemanticColorKey, next: string) => void;
}) {
  const [open, setOpen] = useState<SemanticColorKey | null>(null);
  const keys: SemanticColorKey[] = ["success", "warning", "error"];

  return (
    <div>
      <div
        className="text-xs font-medium mb-1.5"
        style={{ color: "var(--xds-tool-text-muted)" }}
      >
        시맨틱 색
      </div>
      <div className="flex gap-2 mb-2">
        {keys.map((k) => {
          const isOpen = open === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setOpen(isOpen ? null : k)}
              className="flex-1 flex items-center gap-1.5 p-1.5 rounded-md transition-colors text-left"
              style={{
                background: isOpen ? "var(--xds-tool-elevated)" : "transparent",
                border: `1px solid ${isOpen ? "var(--xds-tool-primary)" : "var(--xds-tool-border)"}`,
              }}
              aria-expanded={isOpen}
              aria-label={`${SEMANTIC_COLOR_LABELS[k]} 색 ${isOpen ? "접기" : "편집"}`}
            >
              <span
                className="size-5 rounded shrink-0"
                style={{
                  background: seed.color[k],
                  border: "1px solid var(--xds-tool-border)",
                }}
                aria-hidden
              />
              <span className="text-[11px] font-medium truncate">{SEMANTIC_COLOR_LABELS[k]}</span>
            </button>
          );
        })}
      </div>
      {open ? (
        <div className="pl-1">
          <OklchColorPicker
            value={seed.color[open]}
            onChange={(next) => onChange(open, next)}
          />
        </div>
      ) : null}
    </div>
  );
}
