import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--xds-tool-text-muted)" }}>
        {label}
      </div>
      {children}
      {hint ? (
        <div className="text-[11px] mt-1" style={{ color: "var(--xds-tool-text-muted)" }}>
          {hint}
        </div>
      ) : null}
    </label>
  );
}

export function SegmentedRadio<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: readonly { label: string; value: T }[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex p-0.5 rounded-md"
      style={{
        background: "var(--xds-tool-elevated)",
        border: "1px solid var(--xds-tool-border)",
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="px-3 py-1 text-xs font-medium rounded transition-colors"
            style={{
              background: active ? "var(--xds-tool-surface)" : "transparent",
              color: active ? "var(--xds-tool-text)" : "var(--xds-tool-text-muted)",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: readonly { label: string; value: T }[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 px-2 text-sm rounded-md w-full"
      style={{
        background: "var(--xds-tool-surface)",
        color: "var(--xds-tool-text)",
        border: "1px solid var(--xds-tool-border)",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 px-3 text-sm rounded-md w-full"
      style={{
        background: "var(--xds-tool-surface)",
        color: "var(--xds-tool-text)",
        border: "1px solid var(--xds-tool-border)",
      }}
    />
  );
}
