/**
 * WCAG/KWCAG 64항목 데이터 파일 회귀 테스트.
 *
 * 11_Accessibility_Spec.md §3의 항목 수가 변할 일은 거의 없으므로
 * 합계·카테고리별 수를 단단히 잠근다. KWCAG 정책 갱신 시 본 테스트가
 * 의도된 변경의 안전 게이트 역할을 한다.
 */

import { describe, expect, it } from "vitest";
import {
  CRITERIA,
  CRITERIA_BY_CATEGORY,
  CRITERIA_BY_ID,
  autoVerifiableCriteria,
  criteriaByAxeRule,
  filterCriteria,
} from "../criteria";

describe("WCAG/KWCAG 64항목 데이터", () => {
  it("총합이 64개다", () => {
    expect(CRITERIA).toHaveLength(64);
  });

  it("카테고리별 수가 명세와 일치한다 (P18·O16·U14·R8·K8)", () => {
    expect(CRITERIA_BY_CATEGORY.perceivable).toHaveLength(18);
    expect(CRITERIA_BY_CATEGORY.operable).toHaveLength(16);
    expect(CRITERIA_BY_CATEGORY.understandable).toHaveLength(14);
    expect(CRITERIA_BY_CATEGORY.robust).toHaveLength(8);
    expect(CRITERIA_BY_CATEGORY.korean).toHaveLength(8);
  });

  it("모든 ID가 고유하다", () => {
    const ids = CRITERIA.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("CRITERIA_BY_ID 인덱스가 모든 항목을 포함한다", () => {
    for (const c of CRITERIA) {
      expect(CRITERIA_BY_ID[c.id]).toBe(c);
    }
  });

  it("autoVerifiableCriteria는 manual 항목을 제외한다", () => {
    const auto = autoVerifiableCriteria();
    expect(auto.every((c) => c.verification !== "manual")).toBe(true);
    // 명세 §10.2 — 자동 가능 약 50개 (manual은 7개: P-16·R-06·R-08·U-10·K-03·K-06·K-08)
    expect(auto.length).toBe(64 - 7);
  });

  it("axe 룰 매핑이 일관된다 (P-01 대비비는 color-contrast로 검출)", () => {
    expect(criteriaByAxeRule("color-contrast").length).toBeGreaterThan(0);
    expect(criteriaByAxeRule("color-contrast").some((c) => c.id === "P-01")).toBe(true);
  });

  it("filterCriteria(surface: A) 결과는 A 또는 AB만 포함한다", () => {
    const aOnly = filterCriteria({ surface: "A" });
    expect(aOnly.every((c) => c.surface === "A" || c.surface === "AB")).toBe(true);
  });

  it("block 처리 항목은 모두 autoCorrect 가능 여부와 무관하게 surface가 정의되어 있다", () => {
    const blocks = filterCriteria({ processing: "block" });
    for (const c of blocks) {
      expect(["A", "B", "AB"]).toContain(c.surface);
    }
  });

  it("한국어 자간·행간 항목은 P와 K 양쪽에 존재한다 (Spec §3.1 ↔ §3.5)", () => {
    expect(CRITERIA_BY_ID["P-08"]).toBeDefined();
    expect(CRITERIA_BY_ID["K-01"]).toBeDefined();
    expect(CRITERIA_BY_ID["P-09"]).toBeDefined();
    expect(CRITERIA_BY_ID["K-02"]).toBeDefined();
  });
});
