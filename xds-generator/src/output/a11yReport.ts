/**
 * Output Spec §7 — accessibility-report.md 생성.
 *
 * runAllChecks 결과를 카테고리별로 묶어 통과·미달·수동 항목을 정리한다.
 * Export 직전에 생성되므로 항상 최신 상태를 반영.
 */

import { CRITERIA_BY_CATEGORY, CATEGORY_LABEL, type Category } from "../a11y/criteria";
import type { CheckResult } from "../a11y/engine";
import type { AppliedAutoFix } from "../store/types";
import { GENERATOR_VERSION } from "../version";

interface Ctx {
  projectName: string;
  projectVersion: string;
  generatedAt: string;
  results: readonly CheckResult[];
  appliedAutoFixes?: readonly AppliedAutoFix[];
}

export function buildAccessibilityReport(ctx: Ctx): string {
  const { projectName, projectVersion, generatedAt, results } = ctx;
  const byId = new Map(results.map((r) => [r.criterionId, r]));
  const counts = bucketCounts(results);
  const overallPass = counts.fail === 0;

  const lines: string[] = [
    `# 접근성 검증 보고서 — ${projectName}`,
    "",
    `> Generated: ${generatedAt} | 도구 버전: v${GENERATOR_VERSION} | 프로젝트 버전: ${projectVersion}`,
    "> 기준: WCAG 2.2 AA + KWCAG 2.2",
    "",
    "## 요약",
    "",
    "| 기준 | 상태 |",
    "|---|---|",
    `| WCAG 2.2 AA | ${overallPass ? "✅ Pass" : "❌ Fail"} |`,
    `| KWCAG 2.2 | ${overallPass ? "✅ Pass" : "❌ Fail"} |`,
    `| 총 점검 항목 | ${results.length} (Accessibility Spec §3 — 64항목) |`,
    `| 통과 | ${counts.pass} |`,
    `| 미달 | ${counts.fail} |`,
    `| 경고 | ${counts.warn} |`,
    `| 수동 검토 필요 | ${counts.manual} |`,
    "",
  ];

  for (const cat of ["perceivable", "operable", "understandable", "robust", "korean"] as Category[]) {
    const items = CRITERIA_BY_CATEGORY[cat];
    if (items.length === 0) continue;
    lines.push(`## ${CATEGORY_LABEL[cat]} (${cat})`);
    lines.push("");
    lines.push("| ID | 항목 | 상태 | 측정값 | 비고 |");
    lines.push("|---|---|---|---|---|");
    for (const c of items) {
      const r = byId.get(c.id);
      const status = r ? STATUS_ICON[r.status] : "—";
      const actual = r?.actual ?? "—";
      const note = r?.message ?? "검사 미수행";
      lines.push(`| ${c.id} | ${c.title} | ${status} | ${actual} | ${escapeCell(note)} |`);
    }
    lines.push("");
  }

  // 자동 보정 적용 내역 — 실제로 디자이너가 [보정 적용]을 누른 기록.
  if (ctx.appliedAutoFixes && ctx.appliedAutoFixes.length > 0) {
    lines.push("## 자동 보정 적용 내역");
    lines.push("");
    lines.push("마지막 export 이후 디자이너가 적용한 자동 보정입니다.");
    lines.push("");
    lines.push("| 시각 | 기준 | 보정 내용 |");
    lines.push("|---|---|---|");
    for (const f of ctx.appliedAutoFixes) {
      lines.push(`| ${f.appliedAt} | ${f.criterionId} | ${escapeCell(f.description)} |`);
    }
    lines.push("");
  }

  // 자동 보정 제안 — 보정 가능한 미달 중 fix.description이 있는 항목 나열 (적용 전).
  const fixSuggestions = results.filter((r) => r.status === "fail" && r.fix?.description);
  if (fixSuggestions.length > 0) {
    lines.push("## 자동 보정 제안 (미적용)");
    lines.push("");
    lines.push("Export 시점에 다음 보정이 *제안* 상태입니다 (실제 적용은 디자이너 옵트인).");
    lines.push("");
    for (const r of fixSuggestions) {
      lines.push(`- **${r.criterionId}** — ${r.fix!.description}`);
    }
    lines.push("");
  }

  lines.push("## 비검증·예외 항목");
  lines.push("");
  if (counts.manual === 0) {
    lines.push("없음.");
  } else {
    lines.push(`총 ${counts.manual}개 항목이 자동 검증 불가로 수동 검토가 필요합니다 (자막·스크린리더 실측 등).`);
  }
  lines.push("");

  return lines.join("\n");
}

const STATUS_ICON: Record<CheckResult["status"], string> = {
  pass: "✅",
  fail: "❌",
  warn: "⚠️",
  manual: "🟦",
};

function bucketCounts(results: readonly CheckResult[]) {
  const out = { pass: 0, fail: 0, warn: 0, manual: 0 };
  for (const r of results) out[r.status] += 1;
  return out;
}

function escapeCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
