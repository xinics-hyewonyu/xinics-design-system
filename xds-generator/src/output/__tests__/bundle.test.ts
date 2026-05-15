/**
 * Output 파이프라인 통합 — Default 프리셋이 zip 산출물로 끝까지 가는지 회귀.
 *
 * Node 19+의 crypto.subtle을 사용하므로 별도 polyfill 불필요.
 */

import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { runSelfChecks } from "../../a11y/engine";
import { defaultPreset } from "../../presets/default";
import { generateTokenTree } from "../../tokens/build";
import { bundleArtifacts } from "../bundle";
import { tokenTreeToTypeScript } from "../typescript";
import { generateComponentDocs } from "../componentDocs";
import { buildReadme } from "../readme";
import { buildAccessibilityReport } from "../a11yReport";

const tree = generateTokenTree(defaultPreset);
const checks = runSelfChecks(tree);

describe("산출물 단위 생성기", () => {
  it("tokens.ts에 seedTokens·mapTokens·aliasTokens·타입이 포함된다", () => {
    const ts = tokenTreeToTypeScript(tree, {
      projectName: "Sample",
      projectVersion: "1.0.0",
    });
    expect(ts).toContain("export const seedTokens");
    expect(ts).toContain("export const mapTokens");
    expect(ts).toContain("export const aliasTokens");
    expect(ts).toContain("export type ColorScaleStep");
    expect(ts).toContain("DO NOT EDIT MANUALLY");
  });

  it("컴포넌트 명세 5종(Button·Input·Card·Modal·Form)이 모두 생성된다", () => {
    const docs = generateComponentDocs({
      tree,
      projectName: "Sample",
      projectVersion: "1.0.0",
    });
    expect(docs.map((d) => d.name)).toEqual(["Button", "Input", "Card", "Modal", "Form"]);
    expect(docs.every((d) => d.content.includes("## 1. 정의"))).toBe(true);
    expect(docs.every((d) => d.content.includes("## 7. 접근성"))).toBe(true);
  });

  it("README가 컴포넌트 링크와 접근성 보고서 경로를 포함한다", () => {
    const md = buildReadme({
      tree,
      projectName: "Sample",
      projectVersion: "1.0.0",
      projectType: "admin",
      filenameSuffix: "v1.0.0_20260514",
    });
    expect(md).toContain("[Button](components/Button.md)");
    expect(md).toContain("accessibility-report_v1.0.0_20260514.md");
  });

  it("접근성 보고서가 카테고리별 표와 요약을 포함한다", () => {
    const md = buildAccessibilityReport({
      projectName: "Sample",
      projectVersion: "1.0.0",
      generatedAt: tree.meta.derivedAt,
      results: checks,
    });
    expect(md).toContain("## 인지 가능성");
    expect(md).toContain("## 운용 가능성");
    expect(md).toContain("## 한국 특화");
  });
});

describe("bundleArtifacts — 통합 흐름", () => {
  it("zip Blob과 패키지 안 파일 목록을 반환한다", async () => {
    const result = await bundleArtifacts({
      tree,
      project: {
        id: "proj_test",
        name: "TestProject",
        type: "admin",
        version: "1.0.0",
        createdBy: "tester",
        createdByVerified: false,
        createdAt: tree.meta.derivedAt,
      },
      checks,
    });
    expect(result.filename).toMatch(/^TestProject-design-system_v1\.0\.0_\d{8}\.zip$/);
    expect(result.blob.size).toBeGreaterThan(0);

    const paths = result.files.map((f) => f.path).sort();
    expect(paths).toContain("manifest.json");
    expect(paths).toContain("README.md");
    expect(paths.filter((p) => p.startsWith("tokens/"))).toHaveLength(6);
    expect(paths.filter((p) => p.startsWith("components/"))).toHaveLength(5);
    expect(paths.filter((p) => p.startsWith("guides/"))).toHaveLength(1);
  });

  it("manifest.json의 모든 files[]에 SHA-256 체크섬이 포함된다", async () => {
    const result = await bundleArtifacts({
      tree,
      project: {
        id: "proj_test",
        name: "TestProject",
        type: "admin",
        version: "1.0.0",
        createdBy: "tester",
        createdByVerified: false,
        createdAt: tree.meta.derivedAt,
      },
      checks,
    });
    const manifestFile = result.files.find((f) => f.path === "manifest.json")!;
    const manifest = JSON.parse(manifestFile.content);
    for (const f of manifest.files) {
      expect(f.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(f.size).toBeGreaterThan(0);
    }
  });

  it("zip 안에 패키지 디렉토리가 들어있다", async () => {
    const result = await bundleArtifacts({
      tree,
      project: {
        id: "proj_test",
        name: "Sample",
        type: "admin",
        version: "0.1.0",
        createdBy: "tester",
        createdByVerified: false,
        createdAt: tree.meta.derivedAt,
      },
      checks,
    });
    const buffer = await result.blob.arrayBuffer();
    const opened = await JSZip.loadAsync(buffer);
    const entries = Object.keys(opened.files);
    const prefix = "Sample-design-system_v0.1.0_";
    expect(entries.some((e) => e.startsWith(prefix) && e.endsWith("manifest.json"))).toBe(true);
  });
});
