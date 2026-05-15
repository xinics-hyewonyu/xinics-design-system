/**
 * UI Spec §4 — 에디터 (4-panel 레이아웃).
 *
 * 좌측: 스타일 프리셋 리스트 (220px)
 * 중앙: 컴포넌트 프리뷰 (flex) — A11yPanel이 axe-core 스캔 루트로 참조
 * 우상: Customize Theme (340px, 상단)
 * 우하: 접근성 점검 (340px, 하단)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Header } from "../editor/Header";
import { PresetList } from "../editor/PresetList";
import { CustomizeTheme } from "../editor/CustomizeTheme";
import { Preview } from "../editor/Preview";
import { A11yPanel } from "../editor/A11yPanel";
import { useProjectStore, projectToEffectivePreset } from "../store/projectStore";
import { generateTokenTree } from "../tokens/build";

const SPLIT_KEY = "xds:editor:right-split-pct";
const SPLIT_MIN = 25;
const SPLIT_MAX = 80;

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const setPreset = useProjectStore((s) => s.setPreset);
  const previewRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const [topPct, setTopPct] = useState<number>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(SPLIT_KEY) : null;
    const n = stored ? Number.parseFloat(stored) : NaN;
    return Number.isFinite(n) && n >= SPLIT_MIN && n <= SPLIT_MAX ? n : 58;
  });
  const draggingRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SPLIT_KEY, String(topPct));
    } catch {
      // 사용자가 storage 거부 — 무시.
    }
  }, [topPct]);

  const onDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !rightColRef.current) return;
    const rect = rightColRef.current.getBoundingClientRect();
    const ratio = ((e.clientY - rect.top) / rect.height) * 100;
    const clamped = Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, ratio));
    setTopPct(clamped);
  }, []);

  const onDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const onKeyAdjust = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const STEP = 2;
    if (e.key === "ArrowUp") setTopPct((p) => Math.max(SPLIT_MIN, p - STEP));
    else if (e.key === "ArrowDown") setTopPct((p) => Math.min(SPLIT_MAX, p + STEP));
    else return;
    e.preventDefault();
  }, []);

  const tree = useMemo(
    () => (project ? generateTokenTree(projectToEffectivePreset(project)) : null),
    [project],
  );

  if (!project) {
    return <Navigate to="/" replace />;
  }
  if (!tree) return null;

  return (
    <div className="h-screen flex flex-col">
      <Header projectName={project.name} mode="editor" />
      <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: "220px 1fr 340px" }}>
        <PresetList
          selectedId={project.presetId}
          projectType={project.type}
          onSelect={(presetId) => setPreset(project.id, presetId)}
        />
        <Preview ref={previewRef} tree={tree} />
        <div ref={rightColRef} className="flex flex-col min-h-0">
          <div
            className="overflow-y-auto px-4 py-4"
            style={{
              flex: `0 0 ${topPct}%`,
              background: "var(--xds-tool-surface)",
              borderLeft: "1px solid var(--xds-tool-border)",
            }}
          >
            <CustomizeTheme project={project} />
          </div>
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-valuemin={SPLIT_MIN}
            aria-valuemax={SPLIT_MAX}
            aria-valuenow={Math.round(topPct)}
            aria-label="패널 높이 조절"
            tabIndex={0}
            className="h-1.5 cursor-row-resize select-none touch-none"
            style={{
              background: "var(--xds-tool-border)",
              borderLeft: "1px solid var(--xds-tool-border)",
            }}
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            onKeyDown={onKeyAdjust}
            onDoubleClick={() => setTopPct(58)}
            title="드래그하거나 ↑↓ 키로 높이 조절 · 더블클릭으로 초기화"
          />
          <div className="flex-1 min-h-0">
            <A11yPanel tree={tree} projectId={project.id} previewRef={previewRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
