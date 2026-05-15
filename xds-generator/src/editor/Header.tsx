import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Download, Settings, ChevronLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useProjectStore } from "../store/projectStore";
import { ExportWizard } from "./ExportWizard";

export function Header({ projectName, mode }: { projectName?: string; mode: "dashboard" | "editor" }) {
  const saveStatus = useProjectStore((s) => s.saveStatus);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.canUndo());
  const canRedo = useProjectStore((s) => s.canRedo());
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-10 h-14 flex items-center px-5 gap-3"
      style={{
        background: "var(--xds-tool-surface)",
        borderBottom: "1px solid var(--xds-tool-border)",
      }}
    >
      <Link to="/" className="flex items-center gap-2 hover:opacity-80" aria-label="대시보드로">
        {mode === "editor" ? <ChevronLeft className="size-4" /> : null}
        <Sparkles className="size-5" style={{ color: "var(--xds-tool-primary)" }} />
        <span className="font-semibold tracking-tight">XDS Generator</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
          style={{
            background: "var(--xds-tool-elevated)",
            color: "var(--xds-tool-text-muted)",
            border: "1px solid var(--xds-tool-border)",
          }}
        >
          v0.1.0
        </span>
      </Link>

      {projectName ? (
        <div className="flex items-center gap-2 ml-2 pl-3" style={{ borderLeft: "1px solid var(--xds-tool-border)" }}>
          <span className="text-sm font-medium">{projectName}</span>
        </div>
      ) : null}

      <div className="flex-1" />

      {mode === "editor" ? (
        <>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo} aria-label="Undo">
              Undo
            </Button>
            <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo} aria-label="Redo">
              Redo
            </Button>
          </div>
          <SaveBadge status={saveStatus} />
          <Button
            size="sm"
            variant="default"
            aria-label="Export"
            onClick={() => setWizardOpen(true)}
            disabled={!currentProjectId}
          >
            <Download className="size-3.5" />
            Export
          </Button>
          <Button size="sm" variant="ghost" aria-label="설정" disabled>
            <Settings className="size-4" />
          </Button>
        </>
      ) : null}

      {wizardOpen && currentProjectId ? (
        <ExportWizard
          projectId={currentProjectId}
          onClose={() => setWizardOpen(false)}
        />
      ) : null}
    </header>
  );
}

function SaveBadge({ status }: { status: ReturnType<typeof useProjectStore.getState>["saveStatus"] }) {
  let label = "";
  let color = "var(--xds-tool-text-muted)";
  if (status.kind === "saving") {
    label = "저장 중…";
  } else if (status.kind === "saved") {
    const t = new Date(status.at);
    label = `저장됨 ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  } else if (status.kind === "error") {
    label = `저장 실패 (재시도 ${status.retries}/3)`;
    color = "var(--xds-tool-danger)";
  }
  if (!label) return null;
  return (
    <span className="text-xs" style={{ color }} aria-live="polite">
      {label}
    </span>
  );
}
