/**
 * Output Spec §3 — manifest.json 빌더.
 *
 * 패키지 안의 모든 파일에 대해 SHA-256 체크섬을 계산하여 포함한다.
 * Output Spec §12 — 무결성 보장의 핵심 산출물.
 */

import { GENERATOR_VERSION } from "../version";
import type { ArtifactFile } from "./bundle";
import type { AppliedAutoFix } from "../store/types";

export interface ProjectMeta {
  id: string;
  name: string;
  type: string;
  version: string;
  createdBy: string;
  createdByVerified: boolean;
  createdAt: string;
}

export interface StyleMeta {
  preset: string;
  darkMode: "auto-derived" | "manual" | "none";
  locale: readonly string[];
  locale_structure_ready_for: readonly string[];
}

export interface AccessibilityMeta {
  wcag_2_2_aa: "passed" | "failed" | "incomplete";
  kwcag_2_2: "passed" | "failed" | "incomplete";
  lastChecked: string;
  report: string;
}

export interface ManifestInput {
  project: ProjectMeta;
  style: StyleMeta;
  accessibility: AccessibilityMeta;
  components: { core: number; domain: number; total: number };
  dependencies: { fontStack: readonly string[]; iconLibrary: string };
  files: readonly ArtifactFile[];
  /** 마지막 export 이후 적용된 자동 보정 — Accessibility Spec §6 audit 트레일. */
  appliedAutoFixes?: readonly AppliedAutoFix[];
}

export interface Manifest {
  $schema: string;
  generator: { name: string; version: string; exportedAt: string };
  project: ProjectMeta;
  style: StyleMeta;
  files: Array<{
    path: string;
    type: ArtifactFile["type"];
    size: number;
    checksum: string;
    version: string;
  }>;
  accessibility: AccessibilityMeta;
  components: { core: number; domain: number; total: number };
  dependencies: { fontStack: readonly string[]; iconLibrary: string };
  appliedAutoFixes?: readonly AppliedAutoFix[];
}

export async function buildManifest(input: ManifestInput): Promise<Manifest> {
  const fileEntries = await Promise.all(
    input.files.map(async (f) => {
      const size = byteSize(f.content);
      const checksum = `sha256:${await sha256(f.content)}`;
      return {
        path: f.path,
        type: f.type,
        size,
        checksum,
        version: input.project.version,
      };
    }),
  );
  return {
    $schema: "https://xds.xinics.com/schemas/manifest-v1.json",
    generator: {
      name: "XDS Generator",
      version: GENERATOR_VERSION,
      exportedAt: new Date().toISOString(),
    },
    project: input.project,
    style: input.style,
    files: fileEntries,
    accessibility: input.accessibility,
    components: input.components,
    dependencies: input.dependencies,
    ...(input.appliedAutoFixes && input.appliedAutoFixes.length > 0
      ? { appliedAutoFixes: input.appliedAutoFixes }
      : {}),
  };
}

function byteSize(content: string): number {
  return new TextEncoder().encode(content).byteLength;
}

/**
 * SHA-256 헥스 다이제스트. 브라우저 `crypto.subtle.digest` 사용.
 * Node 환경(테스트·CLI)에서는 globalThis.crypto가 동일 API 제공 (Node 19+).
 */
export async function sha256(text: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "SHA-256 unavailable: crypto.subtle missing (브라우저 또는 Node 19+ 필요)",
    );
  }
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  const bytes = new Uint8Array(buf);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}
