/**
 * 프로젝트 데이터 모델 — FRD §5 요구사항 1·3·8.
 * 도구 안에 살아있는 프로젝트 1개의 형태.
 */

import type { SeedTokens } from "../tokens/types";

/**
 * 자동 보정 적용 한 건 — Accessibility Spec §6.
 * Export 매니페스트에 그대로 직렬화되어 "어떤 보정이 적용되었는가"를 기록한다.
 */
export interface AppliedAutoFix {
  criterionId: string;
  description: string;
  appliedAt: string;
}

export type ProjectType = "admin" | "lms" | "ai" | "b2c";

/**
 * Project의 Seed 오버라이드.
 * color는 시맨틱 색 키별로 부분 적용이 가능해야 하므로 별도로 Partial 처리한다.
 */
export type SeedOverrides = Omit<Partial<SeedTokens>, "color"> & {
  color?: Partial<SeedTokens["color"]>;
};

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description?: string;
  presetId: string;
  seedOverrides: SeedOverrides;
  createdBy: string;
  createdByVerified: boolean;
  createdAt: string;
  updatedAt: string;
  version: string;
  /**
   * 마지막 export 이후 적용된 자동 보정 기록 — manifest.appliedAutoFixes에 그대로 직렬화.
   * Export 성공 시 클리어한다.
   */
  appliedAutoFixes?: AppliedAutoFix[];
}

export type ActivityAction =
  | "create"
  | "open"
  | "update"
  | "export"
  | "duplicate"
  | "archive";

/** PRD §3.2 H1 — outputs[] 필드. 산출물 stale 판단 메타 포함. */
export interface ActivityOutput {
  type: "tokens" | "component" | "guide" | "bundle";
  filename: string;
  size: number;
  checksum?: string;
  version: string;
  generatorVersion: string;
}

/** FRD §5 요구사항 8 — 작업 로그 엔티티 */
export interface ActivityLog {
  id: number;
  /**
   * 이 로그를 만든 프로젝트의 id. 과거 v0.1 초기 데이터는 이 필드가 없을 수 있어
   * optional로 유지한다. UI에서는 projectId 우선, 없으면 projectName으로 fallback 조회.
   */
  projectId?: string;
  projectName: string;
  creator: string;
  createdAt: string;
  action: ActivityAction;
  styleName?: string;
  outputs?: ActivityOutput[];
}

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string; retries: number };
