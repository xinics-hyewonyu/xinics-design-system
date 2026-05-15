import { Star } from "lucide-react";
import { PRESET_REGISTRY } from "../presets/registry";
import type { ProjectType } from "../store/types";

interface Props {
  selectedId: string;
  projectType: ProjectType;
  onSelect: (presetId: string) => void;
}

export function PresetList({ selectedId, projectType, onSelect }: Props) {
  const recommended = (id: string) =>
    PRESET_REGISTRY.find((p) => p.id === id)?.recommendedFor.includes(projectType) ?? false;

  const sorted = [...PRESET_REGISTRY].sort((a, b) => {
    const ra = recommended(a.id) ? 1 : 0;
    const rb = recommended(b.id) ? 1 : 0;
    return rb - ra;
  });

  return (
    <aside
      className="h-full flex flex-col"
      style={{
        background: "var(--xds-tool-surface)",
        borderRight: "1px solid var(--xds-tool-border)",
      }}
      aria-label="스타일 프리셋"
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--xds-tool-border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--xds-tool-text-muted)" }}>
          스타일 프리셋
        </h2>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sorted.map((preset) => {
          const isSelected = preset.id === selectedId;
          const isRecommended = recommended(preset.id);
          const isDisabled = preset.status === "planned";
          return (
            <li key={preset.id}>
              <button
                type="button"
                onClick={() => !isDisabled && onSelect(preset.id)}
                disabled={isDisabled}
                className="w-full text-left p-2 rounded-md transition-colors disabled:cursor-not-allowed"
                style={{
                  background: isSelected ? "var(--xds-tool-elevated)" : "transparent",
                  border: `1px solid ${isSelected ? "var(--xds-tool-primary)" : "transparent"}`,
                  opacity: isDisabled ? 0.45 : 1,
                }}
                aria-current={isSelected}
                aria-label={`프리셋 ${preset.label}${isRecommended ? " (추천)" : ""}${isDisabled ? " (준비 중)" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden>
                    {preset.emoji}
                  </span>
                  <span className="text-sm font-medium flex-1">{preset.label}</span>
                  {isRecommended ? (
                    <Star
                      className="size-3.5 fill-current"
                      style={{ color: "var(--xds-tool-warning)" }}
                      aria-label="추천"
                    />
                  ) : null}
                </div>
                <p
                  className="text-[11px] mt-0.5 pl-7 leading-snug"
                  style={{ color: "var(--xds-tool-text-muted)" }}
                >
                  {preset.description}
                </p>
                {isDisabled ? (
                  <span
                    className="ml-7 mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded font-mono"
                    style={{
                      background: "var(--xds-tool-elevated)",
                      color: "var(--xds-tool-text-muted)",
                    }}
                  >
                    v0.2+
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div
        className="p-3 text-[11px]"
        style={{
          borderTop: "1px solid var(--xds-tool-border)",
          color: "var(--xds-tool-text-muted)",
        }}
      >
        ★ 표시는 현재 프로젝트 타입에 맞는 추천. 선택은 자유.
      </div>
    </aside>
  );
}
