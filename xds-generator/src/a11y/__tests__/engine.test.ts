/**
 * 접근성 엔진 — Default 프리셋에 대한 회귀 + 의도적 미달 케이스 검증.
 *
 * axe-core 경로는 JSDOM 의존이라 본 테스트에서는 self rules만 검증한다.
 * (실제 axe 실행은 브라우저 환경의 A11yPanel에서 동작 확인.)
 */

import { describe, expect, it } from "vitest";
import { defaultPreset } from "../../presets/default";
import { generateTokenTree } from "../../tokens/build";
import {
  findDarkerForContrast,
  mergeAutoFixes,
  runSelfChecks,
} from "../engine";
import type { StylePreset } from "../../tokens/types";

describe("runSelfChecks — Default 프리셋", () => {
  const tree = generateTokenTree(defaultPreset);
  const results = runSelfChecks(tree);

  it("핵심 self 항목이 모두 보고된다 (P-01·P-02·P-03·O-03·P-10·O-09·K-01·K-02·K-04·K-07)", () => {
    const ids = results.map((r) => r.criterionId).sort();
    expect(ids).toEqual(
      ["K-01", "K-02", "K-04", "K-07", "O-03", "O-09", "P-01", "P-02", "P-03", "P-10"].sort(),
    );
  });

  it("Default 프리셋은 본문 대비비(P-01)를 통과한다 — body·onPrimary·onDanger·link 4페어", () => {
    const p01 = results.find((r) => r.criterionId === "P-01")!;
    expect(p01.status).toBe("pass");
  });

  it("Default 프리셋은 대형 텍스트(P-02) / UI 컴포넌트(P-03) 대비를 통과한다", () => {
    const p02 = results.find((r) => r.criterionId === "P-02")!;
    const p03 = results.find((r) => r.criterionId === "P-03")!;
    expect(p02.status).toBe("pass");
    expect(p03.status).toBe("pass");
  });

  it("Default 프리셋은 포커스 링 가시(O-03)를 통과한다 — width ≥ 2 · 대비 ≥ 3", () => {
    const o03 = results.find((r) => r.criterionId === "O-03")!;
    expect(o03.status).toBe("pass");
  });

  it("Default 프리셋은 한국어 폰트 스택(K-07)을 통과한다", () => {
    const k07 = results.find((r) => r.criterionId === "K-07")!;
    expect(k07.status).toBe("pass");
  });

  it("K-04는 현재 L1 컴포넌트에 자동 갱신 항목이 없어 N/A 통과", () => {
    const k04 = results.find((r) => r.criterionId === "K-04")!;
    expect(k04.status).toBe("pass");
    expect(k04.actual).toBe("N/A");
  });
});

describe("미달 시 자동 보정 제안", () => {
  it("본문 폰트가 12px이면 P-10 미달 + 13px 보정 제안", () => {
    const broken: StylePreset = {
      ...defaultPreset,
      seed: { ...defaultPreset.seed, fontSize: 12 },
    };
    const tree = generateTokenTree(broken);
    const results = runSelfChecks(tree);
    const p10 = results.find((r) => r.criterionId === "P-10")!;
    expect(p10.status).toBe("fail");
    expect(p10.fix?.patch.fontSize).toBe(13);
  });

  it("한국어 폰트가 없으면 K-07 미달 + Pretendard 보정 제안", () => {
    const broken: StylePreset = {
      ...defaultPreset,
      seed: { ...defaultPreset.seed, fontFamily: ["Arial", "sans-serif"] },
    };
    const tree = generateTokenTree(broken);
    const results = runSelfChecks(tree);
    const k07 = results.find((r) => r.criterionId === "K-07")!;
    expect(k07.status).toBe("fail");
    expect(k07.fix?.patch.fontFamily?.[0]).toBe("Pretendard");
  });

  it("mergeAutoFixes는 여러 fail의 patch를 한 번에 합친다", () => {
    const broken: StylePreset = {
      ...defaultPreset,
      seed: {
        ...defaultPreset.seed,
        fontSize: 11,
        fontFamily: ["Arial"],
      },
    };
    const tree = generateTokenTree(broken);
    const results = runSelfChecks(tree);
    const merged = mergeAutoFixes(results);
    expect(merged).not.toBeNull();
    expect(merged?.fontSize).toBe(13);
    expect(merged?.fontFamily?.[0]).toBe("Pretendard");
  });
});

describe("findDarkerForContrast", () => {
  it("흰 배경에서 어두운 텍스트가 4.5:1을 통과하도록 색을 어둡게 만든다", () => {
    const result = findDarkerForContrast("oklch(0.7 0.05 250)", "oklch(0.97 0 0)", 4.5);
    expect(result).not.toBeNull();
  });

  it("이미 통과한 경우 첫 candidate에서 반환", () => {
    // 거의 검정에 가까운 색은 흰 배경에서 매우 높은 대비비를 가짐.
    const result = findDarkerForContrast("oklch(0.1 0 0)", "oklch(0.97 0 0)", 4.5);
    expect(result).not.toBeNull();
  });
});
