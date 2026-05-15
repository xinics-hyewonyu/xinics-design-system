/**
 * UI Spec §4.4 — OKLCH 슬라이더 + HEX 입력 + 7색 스와치.
 *
 * react-colorful은 HSL/HSV/RGB 모델만 지원하므로 직접 구현.
 * - L 슬라이더 (0~1)
 * - C 슬라이더 (0~0.4, 색조마다 gamut 상한은 다르나 OKLCH는 자동 클램프)
 * - H 슬라이더 (0~360)
 * - HEX/oklch 텍스트 입력
 * - 7색 스와치 (자이닉스 표준)
 */

import { useEffect, useMemo, useState } from "react";
import {
  formatOklch,
  parseColor,
  toHex,
} from "../../tokens/algorithms/oklch";

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** 7색 스와치 (oklch 문자열). 기본은 자이닉스 표준. */
  swatches?: readonly string[];
  /** WCAG 본문 대비비 표시할 때의 배경 색. */
  contrastAgainst?: string;
  /** 표시 너비 */
  className?: string;
}

const DEFAULT_SWATCHES = [
  "oklch(0.55 0.18 250)", // Blue (Default Primary)
  "oklch(0.65 0.17 145)", // Green
  "oklch(0.78 0.15 75)", // Yellow
  "oklch(0.55 0.22 25)", // Red
  "oklch(0.50 0.20 305)", // Purple (Rounded preset)
  "oklch(0.20 0.05 250)", // Zinc (Minimal preset)
  "oklch(0.15 0 0)", // Near-black
];

export function OklchColorPicker({
  value,
  onChange,
  swatches = DEFAULT_SWATCHES,
  className = "",
}: Props) {
  const parsed = useMemo(() => parseColor(value), [value]);
  const [hexInput, setHexInput] = useState(() => toHex(value) ?? "");

  useEffect(() => {
    setHexInput(toHex(value) ?? "");
  }, [value]);

  if (!parsed) {
    return (
      <div className="text-xs text-tool-muted">잘못된 색: {value}</div>
    );
  }

  const update = (next: { l?: number; c?: number; h?: number }) => {
    const merged = {
      l: next.l ?? parsed.l,
      c: next.c ?? parsed.c,
      h: next.h ?? parsed.h,
      alpha: 1,
    };
    onChange(formatOklch(merged));
  };

  const handleHexBlur = () => {
    const candidate = hexInput.trim().startsWith("#") ? hexInput.trim() : `#${hexInput.trim()}`;
    const next = parseColor(candidate);
    if (next) {
      onChange(formatOklch({ ...next, alpha: 1 }));
    } else {
      setHexInput(toHex(value) ?? "");
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="size-10 rounded-md shrink-0"
          style={{
            background: value,
            border: "1px solid var(--xds-tool-border)",
          }}
          aria-label="현재 색 미리보기"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={handleHexBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          aria-label="HEX 입력"
          className="flex-1 h-9 px-2 text-sm font-mono rounded-md min-w-0"
          style={{
            background: "var(--xds-tool-surface)",
            color: "var(--xds-tool-text)",
            border: "1px solid var(--xds-tool-border)",
          }}
        />
      </div>

      <div className="space-y-2.5">
        <OklchSlider
          label="L (명도)"
          axis="l"
          min={0}
          max={1}
          step={0.01}
          value={parsed.l}
          parsed={parsed}
          onChange={(l) => update({ l })}
        />
        <OklchSlider
          label="C (채도)"
          axis="c"
          min={0}
          max={0.4}
          step={0.005}
          value={parsed.c}
          parsed={parsed}
          onChange={(c) => update({ c })}
        />
        <OklchSlider
          label="H (색조)"
          axis="h"
          min={0}
          max={360}
          step={1}
          value={parsed.h}
          parsed={parsed}
          onChange={(h) => update({ h })}
        />
      </div>

      <div className="mt-3">
        <div className="text-xs mb-1.5" style={{ color: "var(--xds-tool-text-muted)" }}>
          스와치
        </div>
        <div className="flex gap-1.5">
          {swatches.map((sw) => (
            <button
              key={sw}
              type="button"
              onClick={() => onChange(sw)}
              className="size-7 rounded-md transition-transform hover:scale-110"
              style={{
                background: sw,
                border: "1px solid var(--xds-tool-border)",
              }}
              aria-label={`스와치 ${sw}`}
              title={sw}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-3 text-[11px] font-mono rounded-md p-2"
        style={{
          background: "var(--xds-tool-elevated)",
          color: "var(--xds-tool-text-muted)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function OklchSlider({
  label,
  axis,
  min,
  max,
  step,
  value,
  parsed,
  onChange,
}: {
  label: string;
  axis: "l" | "c" | "h";
  min: number;
  max: number;
  step: number;
  value: number;
  parsed: { l: number; c: number; h: number; alpha: number };
  onChange: (next: number) => void;
}) {
  const trackGradient = useMemo(() => buildAxisGradient(axis, parsed), [axis, parsed]);
  const displayValue = axis === "h" ? Math.round(value) : Math.round(value * 1000) / 1000;
  // input은 사용자가 타이핑 중 빈 문자열·점 등 부분 상태를 가질 수 있어 별도 string state로 관리.
  const [draft, setDraft] = useState<string>(String(displayValue));
  useEffect(() => {
    setDraft(String(displayValue));
  }, [displayValue]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      setDraft(String(displayValue));
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      setDraft(String(displayValue));
      return;
    }
    const clamped = Math.max(min, Math.min(max, n));
    onChange(clamped);
  };

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="text-[11px] font-medium" style={{ color: "var(--xds-tool-text-muted)" }}>
          {label}
        </span>
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="text-[11px] font-mono tabular-nums w-16 px-1.5 py-0.5 rounded text-right"
          style={{
            background: "var(--xds-tool-surface)",
            color: "var(--xds-tool-text)",
            border: "1px solid var(--xds-tool-border)",
          }}
          aria-label={`${label} 값 입력`}
        />
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: trackGradient }}
        aria-label={`${label} 슬라이더`}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </label>
  );
}

function buildAxisGradient(axis: "l" | "c" | "h", p: { l: number; c: number; h: number }): string {
  const stops: string[] = [];
  if (axis === "l") {
    for (let l = 0; l <= 1.0001; l += 0.1) {
      stops.push(`oklch(${l.toFixed(2)} ${p.c} ${p.h})`);
    }
  } else if (axis === "c") {
    for (let c = 0; c <= 0.4001; c += 0.04) {
      stops.push(`oklch(${p.l} ${c.toFixed(2)} ${p.h})`);
    }
  } else {
    for (let h = 0; h <= 360; h += 30) {
      stops.push(`oklch(${p.l} ${p.c} ${h})`);
    }
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
