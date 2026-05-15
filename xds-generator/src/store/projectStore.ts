/**
 * 프로젝트 스토어 — Zustand + Immer.
 *
 * 책임:
 * - 프로젝트 CRUD (FRD R1)
 * - Seed 토큰 override 적용 (FRD R3) — Map·Alias는 store가 보관하지 않고
 *   render 시점에 generateTokenTree로 즉시 파생 (16ms 갱신 보장)
 * - Undo/Redo (50단계)
 * - 5초 디바운스 자동 저장 (localStorage), 실패 시 3회 재시도 + 비차단 토스트
 * - 작업 로그 append-only 누적
 */

import { create } from "zustand";
import { produce } from "immer";
import type { SeedTokens } from "../tokens/types";
import { defaultPreset } from "../presets/default";
import type {
  ActivityAction,
  ActivityLog,
  ActivityOutput,
  AppliedAutoFix,
  Project,
  ProjectType,
  SaveStatus,
  SeedOverrides,
} from "./types";

const STORAGE_KEY = "xds.generator.v1";
const LOG_STORAGE_KEY = "xds.generator.log.v1";
const AUTOSAVE_DEBOUNCE_MS = 5000;
const MAX_HISTORY = 50;

interface Snapshot {
  projects: Project[];
  currentProjectId: string | null;
}

interface PersistedState {
  projects: Project[];
  currentProjectId: string | null;
  version: 1;
}

interface ProjectStoreState {
  projects: Project[];
  currentProjectId: string | null;
  saveStatus: SaveStatus;
  activityLog: ActivityLog[];
  /** Undo/Redo history. 현재 상태는 history[index]. */
  history: Snapshot[];
  historyIndex: number;
  hydrated: boolean;

  hydrate: () => void;
  createProject: (input: {
    name: string;
    type: ProjectType;
    description?: string;
    createdBy: string;
  }) => Project;
  openProject: (id: string) => void;
  closeProject: () => void;
  duplicateProject: (id: string) => Project | null;
  archiveProject: (id: string) => void;
  updateSeed: (id: string, patch: Partial<SeedTokens>) => void;
  updateSeedColor: (
    id: string,
    key: keyof SeedTokens["color"],
    value: string,
  ) => void;
  setPreset: (id: string, presetId: string) => void;
  /** 자동 보정 1건 적용 기록 — 사용자가 [보정 적용] 또는 [한 번에 보정]을 누른 시점. */
  recordAutoFix: (id: string, fix: AppliedAutoFix) => void;
  logExport: (id: string, outputs: readonly ActivityOutput[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  flushNow: () => Promise<void>;
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function takeSnapshot(state: ProjectStoreState): Snapshot {
  return {
    projects: state.projects.map((p) => ({ ...p, seedOverrides: { ...p.seedOverrides } })),
    currentProjectId: state.currentProjectId,
  };
}

function appendLog(
  prev: ActivityLog[],
  action: ActivityAction,
  project: Project,
  creator: string,
  outputs?: readonly ActivityOutput[],
): ActivityLog[] {
  const next: ActivityLog = {
    id: (prev[prev.length - 1]?.id ?? 0) + 1,
    projectId: project.id,
    projectName: project.name,
    creator,
    createdAt: nowISO(),
    action,
    styleName: project.presetId,
    ...(outputs && outputs.length > 0 ? { outputs: [...outputs] } : {}),
  };
  const merged = [...prev, next];
  persistLog(merged);
  return merged;
}

function persistLog(log: ActivityLog[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(log));
  } catch {
    // append-only — 저장 실패는 무시 (다음 액션에서 다시 시도)
  }
}

let saveTimer: number | null = null;
let saveRetries = 0;

function scheduleAutosave(getState: () => ProjectStoreState, set: (s: Partial<ProjectStoreState>) => void): void {
  if (typeof window === "undefined") return;
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  set({ saveStatus: { kind: "idle" } });
  saveTimer = window.setTimeout(async () => {
    saveTimer = null;
    await persistNow(getState, set);
  }, AUTOSAVE_DEBOUNCE_MS);
}

async function persistNow(
  getState: () => ProjectStoreState,
  set: (s: Partial<ProjectStoreState>) => void,
): Promise<void> {
  if (typeof localStorage === "undefined") return;
  set({ saveStatus: { kind: "saving" } });
  const { projects, currentProjectId } = getState();
  const payload: PersistedState = { projects, currentProjectId, version: 1 };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    saveRetries = 0;
    set({ saveStatus: { kind: "saved", at: nowISO() } });
  } catch (err) {
    saveRetries += 1;
    set({
      saveStatus: {
        kind: "error",
        message: err instanceof Error ? err.message : "저장 실패",
        retries: saveRetries,
      },
    });
    if (saveRetries < 3 && typeof window !== "undefined") {
      const backoff = 1000 * 2 ** saveRetries;
      window.setTimeout(() => persistNow(getState, set), backoff);
    }
  }
}

function loadPersisted(): PersistedState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadLog(): ActivityLog[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivityLog[]) : [];
  } catch {
    return [];
  }
}

function pushHistory(state: ProjectStoreState): Partial<ProjectStoreState> {
  const snapshot = takeSnapshot(state);
  const truncated = state.history.slice(0, state.historyIndex + 1);
  const next = [...truncated, snapshot];
  const overflow = Math.max(0, next.length - MAX_HISTORY);
  const trimmed = overflow > 0 ? next.slice(overflow) : next;
  return {
    history: trimmed,
    historyIndex: trimmed.length - 1,
  };
}

function restoreSnapshot(snapshot: Snapshot): Partial<ProjectStoreState> {
  return {
    projects: snapshot.projects.map((p) => ({ ...p })),
    currentProjectId: snapshot.currentProjectId,
  };
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  saveStatus: { kind: "idle" },
  activityLog: [],
  history: [{ projects: [], currentProjectId: null }],
  historyIndex: 0,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const persisted = loadPersisted();
    const log = loadLog();
    if (persisted) {
      set({
        projects: persisted.projects,
        currentProjectId: persisted.currentProjectId,
        activityLog: log,
        history: [{ projects: persisted.projects, currentProjectId: persisted.currentProjectId }],
        historyIndex: 0,
        hydrated: true,
      });
    } else {
      set({ activityLog: log, hydrated: true });
    }
  },

  createProject: ({ name, type, description, createdBy }) => {
    const project: Project = {
      id: makeId("proj"),
      name,
      type,
      description,
      presetId: defaultPreset.id,
      seedOverrides: {},
      createdBy,
      createdByVerified: false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      version: "0.1.0",
    };
    set(
      produce<ProjectStoreState>((draft) => {
        draft.projects.push(project);
        draft.currentProjectId = project.id;
        draft.activityLog = appendLog(draft.activityLog, "create", project, createdBy);
      }),
    );
    set(pushHistory(get()));
    scheduleAutosave(get, set);
    return project;
  },

  openProject: (id) => {
    set(
      produce<ProjectStoreState>((draft) => {
        const proj = draft.projects.find((p) => p.id === id);
        if (!proj) return;
        draft.currentProjectId = id;
        draft.activityLog = appendLog(draft.activityLog, "open", proj, proj.createdBy);
      }),
    );
    set(pushHistory(get()));
  },

  closeProject: () => {
    set({ currentProjectId: null });
    set(pushHistory(get()));
  },

  duplicateProject: (id) => {
    const source = get().projects.find((p) => p.id === id);
    if (!source) return null;
    const clone: Project = {
      ...source,
      id: makeId("proj"),
      name: `${source.name} (복제)`,
      seedOverrides: { ...source.seedOverrides },
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    set(
      produce<ProjectStoreState>((draft) => {
        draft.projects.push(clone);
        draft.activityLog = appendLog(draft.activityLog, "duplicate", clone, clone.createdBy);
      }),
    );
    set(pushHistory(get()));
    scheduleAutosave(get, set);
    return clone;
  },

  archiveProject: (id) => {
    set(
      produce<ProjectStoreState>((draft) => {
        const idx = draft.projects.findIndex((p) => p.id === id);
        if (idx < 0) return;
        const removed = draft.projects[idx];
        draft.projects.splice(idx, 1);
        if (draft.currentProjectId === id) draft.currentProjectId = null;
        draft.activityLog = appendLog(draft.activityLog, "archive", removed, removed.createdBy);
      }),
    );
    set(pushHistory(get()));
    scheduleAutosave(get, set);
  },

  updateSeed: (id, patch) => {
    set(
      produce<ProjectStoreState>((draft) => {
        const proj = draft.projects.find((p) => p.id === id);
        if (!proj) return;
        // Seed 객체는 nested color를 가지므로 얕은 머지로 충분 (color는 별도 액션 사용)
        const next: SeedOverrides = { ...proj.seedOverrides, ...patch };
        proj.seedOverrides = next;
        proj.updatedAt = nowISO();
      }),
    );
    set(pushHistory(get()));
    scheduleAutosave(get, set);
  },

  updateSeedColor: (id, key, value) => {
    set(
      produce<ProjectStoreState>((draft) => {
        const proj = draft.projects.find((p) => p.id === id);
        if (!proj) return;
        const prevColor = proj.seedOverrides.color ?? {};
        const next: SeedOverrides = {
          ...proj.seedOverrides,
          color: { ...prevColor, [key]: value },
        };
        proj.seedOverrides = next;
        proj.updatedAt = nowISO();
      }),
    );
    set(pushHistory(get()));
    scheduleAutosave(get, set);
  },

  setPreset: (id, presetId) => {
    set(
      produce<ProjectStoreState>((draft) => {
        const proj = draft.projects.find((p) => p.id === id);
        if (!proj) return;
        proj.presetId = presetId;
        proj.updatedAt = nowISO();
        draft.activityLog = appendLog(draft.activityLog, "update", proj, proj.createdBy);
      }),
    );
    set(pushHistory(get()));
    scheduleAutosave(get, set);
  },

  recordAutoFix: (id, fix) => {
    set(
      produce<ProjectStoreState>((draft) => {
        const proj = draft.projects.find((p) => p.id === id);
        if (!proj) return;
        const prev = proj.appliedAutoFixes ?? [];
        proj.appliedAutoFixes = [...prev, fix];
      }),
    );
    // 보정 기록은 audit 정보라 자동저장에만 흘려보낸다 (Undo 대상 아님).
    scheduleAutosave(get, set);
  },

  logExport: (id, outputs) => {
    set(
      produce<ProjectStoreState>((draft) => {
        const proj = draft.projects.find((p) => p.id === id);
        if (!proj) return;
        draft.activityLog = appendLog(
          draft.activityLog,
          "export",
          proj,
          proj.createdBy,
          outputs,
        );
        // Export 성공 시 보정 기록을 비운다 — 다음 export부터 새 기록을 누적.
        proj.appliedAutoFixes = [];
      }),
    );
    // 로그만 변경되므로 history snapshot은 push하지 않는다 (Undo 대상 아님).
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const nextIdx = historyIndex - 1;
    const snap = history[nextIdx];
    set({ ...restoreSnapshot(snap), historyIndex: nextIdx });
    scheduleAutosave(get, set);
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const snap = history[nextIdx];
    set({ ...restoreSnapshot(snap), historyIndex: nextIdx });
    scheduleAutosave(get, set);
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  flushNow: async () => {
    if (saveTimer !== null) {
      window.clearTimeout(saveTimer);
      saveTimer = null;
    }
    await persistNow(get, set);
  },
}));

/** Project + override를 합쳐 빌더에 넘길 StylePreset 만들기. */
export function projectToEffectivePreset(project: Project) {
  const baseSeed = defaultPreset.seed;
  const merged: SeedTokens = {
    ...baseSeed,
    ...project.seedOverrides,
    color: {
      ...baseSeed.color,
      ...(project.seedOverrides.color ?? {}),
    },
  };
  return {
    ...defaultPreset,
    id: defaultPreset.id,
    name: defaultPreset.name,
    seed: merged,
  };
}
