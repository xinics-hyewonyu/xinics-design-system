/**
 * Output Spec §2 — 단일 zip 패키지 빌더.
 *
 * TokenTree + 프로젝트 메타 + 접근성 검사 결과를 받아
 * Output Spec §2.2 구조의 zip Blob을 만든다. 브라우저에서 직접 다운로드 트리거 가능.
 */

import JSZip from "jszip";
import type { TokenTree } from "../tokens/types";
import type { CheckResult } from "../a11y/engine";
import { tokenTreeToCss } from "./cssVariables";
import { tokenTreeToTypeScript } from "./typescript";
import { tokenTreeToW3C } from "./w3c";
import { generateComponentDocs } from "./componentDocs";
import { buildReadme } from "./readme";
import { buildAccessibilityReport } from "./a11yReport";
import { buildManifest, type AccessibilityMeta, type ProjectMeta } from "./manifest";
import type { AppliedAutoFix } from "../store/types";

export type ArtifactType =
  | "tokens"
  | "component"
  | "guide"
  | "manifest"
  | "readme";

export interface ArtifactFile {
  /** 패키지 루트로부터의 상대 경로 (예: `tokens/tokens_v1.0.0_20260514.css`) */
  path: string;
  /** UTF-8 텍스트 내용. */
  content: string;
  type: ArtifactType;
}

export interface BundleInput {
  tree: TokenTree;
  project: ProjectMeta;
  /** runAllChecks 결과 — accessibility-report.md에 그대로 사용. */
  checks: readonly CheckResult[];
  /** Output Spec §2.1 — packageName(zip 파일명에도 사용). */
  packageDirName?: string;
  /** 마지막 export 이후 적용된 자동 보정 — manifest와 accessibility-report에 기록. */
  appliedAutoFixes?: readonly AppliedAutoFix[];
}

export interface BundleResult {
  blob: Blob;
  /** zip 파일명 (Output Spec §2.1). */
  filename: string;
  /** 패키지 안의 모든 파일 (manifest 제외 외부 미리보기용). */
  files: readonly ArtifactFile[];
}

/**
 * 산출물 묶음을 메모리에 만들고 (체크섬 산정 포함) zip Blob으로 반환.
 *
 * 흐름:
 *   1. tokens, component, guide 파일 생성
 *   2. README.md, accessibility-report.md 생성
 *   3. manifest.json — files[]의 SHA-256 체크섬 계산 후 직렬화
 *   4. JSZip으로 묶고 Blob 반환
 */
export async function bundleArtifacts(input: BundleInput): Promise<BundleResult> {
  const { tree, project, checks } = input;
  const { name, version } = project;
  const date = tree.meta.derivedAt.slice(0, 10).replace(/-/g, "");
  const filenameSuffix = `v${version}_${date}`;
  const packageDirName = input.packageDirName ?? `${name}-design-system_${filenameSuffix}`;

  const css = tokenTreeToCss(tree, { projectName: name, projectVersion: version });
  const ts = tokenTreeToTypeScript(tree, { projectName: name, projectVersion: version });
  const w3c = tokenTreeToW3C(tree, { projectName: name, projectVersion: version });
  const w3cJson = JSON.stringify(w3c, null, 2);
  const seedJson = JSON.stringify({ $metadata: w3c.$metadata, seed: w3c.seed }, null, 2);
  const mapJson = JSON.stringify(
    { $metadata: w3c.$metadata, seed: w3c.seed, map: w3c.map },
    null,
    2,
  );
  const aliasJson = JSON.stringify({ $metadata: w3c.$metadata, alias: w3c.alias }, null, 2);

  const tokenFiles: ArtifactFile[] = [
    { path: `tokens/tokens_${filenameSuffix}.css`, content: css, type: "tokens" },
    { path: `tokens/tokens_${filenameSuffix}.json`, content: w3cJson, type: "tokens" },
    { path: `tokens/tokens_${filenameSuffix}.ts`, content: ts, type: "tokens" },
    { path: `tokens/tokens.seed_${filenameSuffix}.json`, content: seedJson, type: "tokens" },
    { path: `tokens/tokens.map_${filenameSuffix}.json`, content: mapJson, type: "tokens" },
    { path: `tokens/tokens.alias_${filenameSuffix}.json`, content: aliasJson, type: "tokens" },
  ];

  const componentDocs = generateComponentDocs({
    tree,
    projectName: name,
    projectVersion: version,
  });
  const componentFiles: ArtifactFile[] = componentDocs.map((doc) => ({
    path: `components/${doc.name}_${filenameSuffix}.md`,
    content: doc.content,
    type: "component",
  }));

  const a11yReport = buildAccessibilityReport({
    projectName: name,
    projectVersion: version,
    generatedAt: tree.meta.derivedAt,
    results: checks,
    appliedAutoFixes: input.appliedAutoFixes,
  });
  const guideFiles: ArtifactFile[] = [
    {
      path: `guides/accessibility-report_${filenameSuffix}.md`,
      content: a11yReport,
      type: "guide",
    },
  ];

  const readme = buildReadme({
    tree,
    projectName: name,
    projectVersion: version,
    projectType: project.type,
    filenameSuffix,
  });

  // manifest를 만들기 전까지의 모든 컨텐츠 파일 (manifest 자체는 체크섬 계산 대상에서 제외).
  const contentFiles: ArtifactFile[] = [
    ...tokenFiles,
    ...componentFiles,
    ...guideFiles,
    { path: "README.md", content: readme, type: "readme" },
  ];

  const accessibility: AccessibilityMeta = {
    wcag_2_2_aa: checks.some((c) => c.status === "fail") ? "failed" : "passed",
    kwcag_2_2: checks.some((c) => c.status === "fail" && c.criterion.kwcagRef) ? "failed" : "passed",
    lastChecked: new Date().toISOString(),
    report: `guides/accessibility-report_${filenameSuffix}.md`,
  };

  const manifest = await buildManifest({
    project,
    style: {
      preset: tree.meta.presetId,
      darkMode: "auto-derived",
      locale: ["ko"],
      locale_structure_ready_for: [],
    },
    accessibility,
    components: { core: componentFiles.length, domain: 0, total: componentFiles.length },
    dependencies: {
      fontStack: tree.seed.fontFamily,
      iconLibrary: "lucide-react",
    },
    files: contentFiles,
    appliedAutoFixes: input.appliedAutoFixes,
  });

  const manifestJson = JSON.stringify(manifest, null, 2);
  const allFiles: ArtifactFile[] = [
    { path: "manifest.json", content: manifestJson, type: "manifest" },
    ...contentFiles,
  ];

  const zip = new JSZip();
  for (const f of allFiles) {
    zip.file(`${packageDirName}/${f.path}`, f.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return {
    blob,
    filename: `${packageDirName}.zip`,
    files: allFiles,
  };
}

/**
 * 브라우저에서 Blob을 사용자 다운로드로 트리거.
 * 사용 예: `triggerDownload(blob, filename)`.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
