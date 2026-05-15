import type { InputHTMLAttributes } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (next: number) => void;
}

export function Slider({ label, value, min, max, step = 1, unit, onChange, ...rest }: Props) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-tool-muted">{label}</span>
        <span className="text-xs font-mono tabular-nums" style={{ color: "var(--xds-tool-text)" }}>
          {value}
          {unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--xds-tool-primary) 0%, var(--xds-tool-primary) ${((value - min) / (max - min)) * 100}%, var(--xds-tool-border) ${((value - min) / (max - min)) * 100}%, var(--xds-tool-border) 100%)`,
        }}
        aria-label={`${label} 슬라이더, 현재 값 ${value}${unit ?? ""}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        {...rest}
      />
    </label>
  );
}
