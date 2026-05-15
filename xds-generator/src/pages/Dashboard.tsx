/**
 * UI Spec §3 — 대시보드.
 *
 * 프로젝트 카드 그리드 + 최근 작업 타임라인 (FRD R1·R8).
 * 첫 사용자 빈 상태 + 4개 타입 안내 카드.
 */

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Archive, Download, FolderOpen } from "lucide-react";
import { Header } from "../editor/Header";
import { Button } from "../components/ui/Button";
import { NewProjectDialog } from "./NewProjectDialog";
import { useProjectStore, projectToEffectivePreset } from "../store/projectStore";
import type { ProjectType } from "../store/types";
import { generateTokenTree } from "../tokens/build";
import { runSelfChecks } from "../a11y/engine";
import { bundleArtifacts, triggerDownload } from "../output/bundle";

const TYPE_LABEL: Record<ProjectType, string> = {
  admin: "B2B 어드민",
  lms: "교육·LMS",
  ai: "AI 제품",
  b2c: "B2C",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const activityLog = useProjectStore((s) => s.activityLog);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const openProject = useProjectStore((s) => s.openProject);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [redownloadFor, setRedownloadFor] = useState<string | null>(null);

  const goToProject = (id: string) => {
    openProject(id);
    navigate(`/projects/${id}`);
  };

  /**
   * 최근 작업 로그의 파일명을 클릭했을 때 현재 프로젝트 상태로 bundle을 재생성하여
   * 다운로드. 정확한 과거 스냅샷은 v0.3 버전 관리에서 도입 예정 — 그때까지는 현재 상태 기반.
   * 프로젝트가 아카이브·삭제됐다면 안내.
   */
  const handleRedownload = useCallback(
    async (log: { projectId?: string; projectName: string; outputs?: { filename: string }[] }) => {
      const project =
        (log.projectId ? projects.find((p) => p.id === log.projectId) : null) ??
        projects.find((p) => p.name === log.projectName) ??
        null;
      if (!project) {
        window.alert(
          `'${log.projectName}' 프로젝트를 찾을 수 없습니다 (아카이브되었거나 삭제됨). 재다운로드 불가.`,
        );
        return;
      }
      const key = `${log.projectId ?? log.projectName}:${log.outputs?.[0]?.filename ?? ""}`;
      setRedownloadFor(key);
      try {
        const tree = generateTokenTree(projectToEffectivePreset(project));
        const checks = runSelfChecks(tree);
        const result = await bundleArtifacts({
          tree,
          project: {
            id: project.id,
            name: project.name,
            type: project.type,
            version: project.version,
            createdBy: project.createdBy,
            createdByVerified: project.createdByVerified,
            createdAt: project.createdAt,
          },
          checks,
        });
        triggerDownload(result.blob, result.filename);
      } catch (err) {
        window.alert(`재다운로드 실패: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setRedownloadFor(null);
      }
    },
    [projects],
  );

  return (
    <div className="min-h-screen">
      <Header mode="dashboard" />
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">안녕하세요</h1>
            <p className="text-sm mt-1" style={{ color: "var(--xds-tool-text-muted)" }}>
              자이닉스 디자인 시스템 생성 도구 — Sprint 1B에디터.
            </p>
          </div>
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            새 프로젝트
          </Button>
        </div>

        <section className="mb-8">
          <SectionTitle>최근 작업</SectionTitle>
          {activityLog.length === 0 ? (
            <EmptyHint>
              아직 작업 기록이 없습니다. "새 프로젝트"로 시작해 보세요.
            </EmptyHint>
          ) : (
            <ul className="space-y-1.5">
              {activityLog
                .slice()
                .reverse()
                .slice(0, 5)
                .map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-md text-sm"
                    style={{
                      background: "var(--xds-tool-surface)",
                      border: "1px solid var(--xds-tool-border)",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{log.projectName}</span>
                      <ActionBadge action={log.action} />
                      {log.styleName ? (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{
                            background: "var(--xds-tool-elevated)",
                            color: "var(--xds-tool-text-muted)",
                          }}
                        >
                          {log.styleName}
                        </span>
                      ) : null}
                      {log.outputs?.map((o) => {
                        const key = `${log.projectId ?? log.projectName}:${o.filename}`;
                        const busy = redownloadFor === key;
                        return (
                          <button
                            key={o.filename}
                            type="button"
                            onClick={() => handleRedownload(log)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono truncate max-w-[260px] transition-colors hover:bg-tool-surface disabled:opacity-50"
                            title={`${o.filename} · ${formatBytes(o.size)} · generator v${o.generatorVersion} — 클릭 시 현재 프로젝트 상태로 재 export`}
                            style={{
                              background: "var(--xds-tool-elevated)",
                              color: "var(--xds-tool-text-muted)",
                              border: "1px solid var(--xds-tool-border)",
                            }}
                            aria-label={`${o.filename} 재다운로드`}
                          >
                            <Download className="size-2.5 shrink-0" aria-hidden />
                            <span className="truncate">{busy ? "준비 중…" : o.filename}</span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs shrink-0 ml-2" style={{ color: "var(--xds-tool-text-muted)" }}>
                      {formatRelative(log.createdAt)} · {log.creator}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section>
          <SectionTitle>모든 프로젝트 ({projects.length})</SectionTitle>
          {projects.length === 0 ? (
            <EmptyState onCreate={() => setDialogOpen(true)} />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {projects.map((p) => (
                <article
                  key={p.id}
                  className="p-4 rounded-md transition-shadow hover:shadow-sm"
                  style={{
                    background: "var(--xds-tool-surface)",
                    border: "1px solid var(--xds-tool-border)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: "var(--xds-tool-elevated)",
                            color: "var(--xds-tool-text-muted)",
                          }}
                        >
                          {TYPE_LABEL[p.type]}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--xds-tool-text-muted)" }}>
                          v{p.version}
                        </span>
                      </div>
                    </div>
                  </div>
                  {p.description ? (
                    <p
                      className="text-xs mt-1 mb-3 line-clamp-2"
                      style={{ color: "var(--xds-tool-text-muted)" }}
                    >
                      {p.description}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--xds-tool-text-muted)" }}>
                    <span>{formatRelative(p.updatedAt)} 수정</span>
                    <span>{p.createdBy}</span>
                  </div>
                  <div className="flex gap-1 mt-3 pt-3" style={{ borderTop: "1px solid var(--xds-tool-border)" }}>
                    <Button size="sm" variant="default" onClick={() => goToProject(p.id)}>
                      <FolderOpen className="size-3" />
                      열기
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateProject(p.id)}
                      aria-label="복제"
                    >
                      <Copy className="size-3" />
                      복제
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`'${p.name}' 프로젝트를 아카이브할까요?`)) archiveProject(p.id);
                      }}
                      aria-label="아카이브"
                    >
                      <Archive className="size-3" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {dialogOpen ? (
        <NewProjectDialog
          onClose={() => setDialogOpen(false)}
          onCreated={(id) => {
            setDialogOpen(false);
            navigate(`/projects/${id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--xds-tool-text-muted)" }}>
      {children}
    </h2>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-4 rounded-md text-sm text-center"
      style={{
        background: "var(--xds-tool-surface)",
        border: "1px dashed var(--xds-tool-border)",
        color: "var(--xds-tool-text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="p-10 rounded-md text-center"
      style={{
        background: "var(--xds-tool-surface)",
        border: "1px dashed var(--xds-tool-border)",
      }}
    >
      <h3 className="text-base font-semibold mb-1">첫 프로젝트를 만들어 보세요</h3>
      <p className="text-sm mb-5" style={{ color: "var(--xds-tool-text-muted)" }}>
        프로젝트 타입에 맞는 추천 프리셋이 자동으로 강조됩니다.
      </p>
      <Button variant="primary" onClick={onCreate}>
        <Plus className="size-4" />
        새 프로젝트
      </Button>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const labels: Record<string, string> = {
    create: "생성",
    open: "열기",
    update: "변경",
    export: "Export",
    duplicate: "복제",
    archive: "아카이브",
  };
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded"
      style={{
        background: "var(--xds-tool-elevated)",
        color: "var(--xds-tool-text-muted)",
      }}
    >
      {labels[action] ?? action}
    </span>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}
