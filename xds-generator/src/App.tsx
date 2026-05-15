/**
 * App 진입점 — UI Spec §1 IA.
 *
 * v0.1 라우트:
 *   /                  대시보드 (프로젝트 리스트)
 *   /projects/:id      에디터 (4-panel)
 *
 * v0.2+ 로 이연된 라우트(/activity, /governance, /export, /ai-generate, /settings)
 * 는 아직 미구현. Sprint 1C·1D 백로그.
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "./pages/Dashboard";
import { EditorPage } from "./pages/Editor";
import { AccessibilityReportPage } from "./pages/AccessibilityReport";
import { useProjectStore } from "./store/projectStore";
import { useKeyboardShortcuts } from "./editor/useKeyboardShortcuts";

export function App() {
  const hydrate = useProjectStore((s) => s.hydrate);
  const hydrated = useProjectStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useKeyboardShortcuts();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "var(--xds-tool-text-muted)" }}>
        XDS Generator를 불러오는 중…
      </div>
    );
  }

  // GitHub Pages 같은 서브경로 배포(`/xinics-design-system/`)와 로컬 dev(`/`) 양쪽에서
  // 라우팅이 일관되도록 Vite가 주입하는 BASE_URL을 basename으로 사용. 로컬 dev에선 "/"
  // 이므로 동작 변화 없음.
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects/:id" element={<EditorPage />} />
        <Route path="/projects/:id/a11y-report" element={<AccessibilityReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}
