/**
 * UI Spec §4.6 — 키보드 단축키.
 *
 * v0.1 범위: Undo/Redo + 명시적 저장. 나머지(Cmd+E·Cmd+K·Cmd+1~3)는 Sprint 1D.
 */

import { useEffect } from "react";
import { useProjectStore } from "../store/projectStore";

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // 입력 필드에서는 단축키 무시
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        if (e.key !== "s") return; // Cmd+S만 글로벌
      }

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useProjectStore.getState().undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        useProjectStore.getState().redo();
      } else if (e.key === "s") {
        e.preventDefault();
        void useProjectStore.getState().flushNow();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
