import { describe, expect, it } from "vitest";
import { validateAssessment, customTextProblem } from "@/features/assessment/schema";
import { SAMPLE_ASSESSMENT } from "@/lib/data/presets";
import { mapCustomTask } from "@/lib/engine/customTasks";
import { scoreDraftReview, scoreOps } from "@/lib/engine/exercises";
import { evaluateAllPaths, evaluatePath, weightedOverlap } from "@/lib/engine/paths";
import { allocateSessions, generatePlan } from "@/lib/engine/plan";
import { buildTaskMap, computeSkillProfile } from "@/lib/engine/profile";
import { ROLE_BY_ID } from "@/lib/data/roles";
import type { AssessmentInput } from "@/types";

const base = SAMPLE_ASSESSMENT;

function results(input: AssessmentInput) {
  const profile = computeSkillProfile(input);
  return { profile, ...evaluateAllPaths(input, profile) };
}

describe("assessment validation", () => {
  it("accepts the sample preset", () => {
    expect(validateAssessment(base).ok).toBe(true);
  });
  it("requires at least 3 tasks", () => {
    const r = validateAssessment({ ...base, taskIds: ["faq_tickets"], customTasks: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.taskIds).toMatch(/at least 3/);
  });
  it("rejects nonsense custom text with a helpful message", () => {
    expect(customTextProblem("asdfghjkl")).not.toBeNull();
    expect(customTextProblem("!!!!!!")).not.toBeNull();
    expect(customTextProblem("ok")).not.toBeNull();
    expect(customTextProblem("Process refund requests")).toBeNull();
  });
  it("requires a title for a custom role", () => {
    const r = validateAssessment({ ...base, roleChoice: "custom", customRoleTitle: "" });
    expect(r.ok).toBe(false);
    expect(validateAssessment({ ...base, roleChoice: "custom", customRoleTitle: "Cashier" }).ok).toBe(true);
  });
});

describe("custom task mapping", () => {
  it("maps keywords to skills and a category", () => {
    const m = mapCustomTask("Build weekly SLA dashboard in Excel");
    expect(m.skills.data_interpretation).toBe(2);
    expect(m.category).toBe("ai_augmented");
  });
  it("matches short keywords only as whole words", () => {
    expect(mapCustomTask("maintain the office plants").matchedRules).not.toContain("ai");
  });
  it("leaves unrecognized tasks unclassified", () => {
    expect(mapCustomTask("water the office plants").category).toBeNull();
  });
});

describe("sample persona", () => {
  it("is recommended Pivot by the engine (computed, not hardcoded)", () => {
    const r = results(SAMPLE_ASSESSMENT);
    expect(r.recommended).toBe("pivot");
    const fit = (id: string) => r.evaluations.find((e) => e.pathId === id)!.fit;
    expect(fit("pivot")).toBeGreaterThan(fit("adapt"));
    expect(fit("pivot")).toBeGreaterThan(fit("reinvent"));
  });
  it("gets a different recommendation when only the goal changes", () => {
    expect(results({ ...SAMPLE_ASSESSMENT, goal: "help_me_choose" }).recommended).toBe("adapt");
    expect(results({ ...SAMPLE_ASSESSMENT, goal: "reinvent", concern: "new_field" }).recommended).not.toBe("pivot");
  });
});

describe("skill profile & paths", () => {
  it("keeps self-reported, inferred and demonstrated evidence separate", () => {
    const p = computeSkillProfile(base);
    expect(p.customer_communication.self).toBe(3);
    expect(p.customer_communication.inferred).toBeGreaterThan(0);
    expect(p.customer_communication.demonstrated).toBeNull();
  });

  it("computes weighted overlap between 0 and 1", () => {
    const o = weightedOverlap(ROLE_BY_ID.customer_success_specialist, computeSkillProfile(base));
    expect(o).toBeGreaterThan(0);
    expect(o).toBeLessThan(1);
  });

  it("recommends a path and changes it when the goal changes", () => {
    const pivotGoal = results({ ...base, goal: "pivot", concern: "adjacent_move" });
    const adaptGoal = results({ ...base, goal: "adapt", concern: "ai_changing_tasks" });
    expect(pivotGoal.recommended).toBe("pivot");
    expect(adaptGoal.recommended).toBe("adapt");
  });

  it("shows different target skills for each path", () => {
    const { evaluations } = results(base);
    const gapSets = evaluations.map((e) => e.gaps.map((g) => g.skill).join(","));
    expect(new Set(gapSets).size).toBe(3);
  });

  it("more weekly time shortens the estimated weeks", () => {
    const profile = computeSkillProfile(base);
    const slow = evaluatePath({ ...base, weeklyTime: "1to2" }, profile, "pivot");
    const fast = evaluatePath({ ...base, weeklyTime: "9plus" }, profile, "pivot");
    expect(fast.weeksHigh).toBeLessThan(slow.weeksHigh);
  });

  it("selected tasks change the inferred profile and the task map", () => {
    const supportHeavy = { ...base, taskIds: ["faq_tickets", "triage_routing", "order_status"] };
    const judgmentHeavy = { ...base, taskIds: ["deescalation", "at_risk_followup", "complex_issues"] };
    expect(buildTaskMap(supportHeavy).shares.automation_exposed).toBe(1);
    expect(buildTaskMap(judgmentHeavy).shares.human_led).toBe(1);
    expect(computeSkillProfile(judgmentHeavy).churn_prevention.effective).toBeGreaterThan(
      computeSkillProfile(supportHeavy).churn_prevention.effective,
    );
  });

  it("applies the income penalty only to Reinvent", () => {
    const { evaluations } = results({ ...base, incomePreference: "keep_level" });
    expect(evaluations.find((e) => e.pathId === "reinvent")!.factors.some((f) => f.id === "income")).toBe(true);
    expect(evaluations.find((e) => e.pathId === "pivot")!.factors.some((f) => f.id === "income")).toBe(false);
  });
});

describe("plan generator", () => {
  const profile = computeSkillProfile(base);

  it("produces a 14-day plan with more sessions for more weekly time", () => {
    const ev = evaluatePath(base, profile, "pivot");
    const small = generatePlan("pivot", ev, "1to2");
    const large = generatePlan("pivot", ev, "9plus");
    expect(Math.max(...small.map((i) => i.day))).toBe(14);
    expect(large.length).toBeGreaterThan(small.length);
  });

  it("differs by path (different modules, not renamed)", () => {
    const pivot = generatePlan("pivot", evaluatePath(base, profile, "pivot"), "3to5");
    const reinvent = generatePlan("reinvent", evaluatePath(base, profile, "reinvent"), "3to5");
    const mods = (p: typeof pivot) => p.filter((i) => i.moduleId).map((i) => i.moduleId).join();
    expect(mods(pivot)).not.toBe(mods(reinvent));
    expect(pivot[0].href).toBe("/challenge/cs-portfolio");
    expect(reinvent[0].href).toBe("/challenge/ops-volume");
  });

  it("allocates sessions exactly and covers the top gaps", () => {
    const alloc = allocateSessions(
      [
        { skill: "churn_prevention", weightedGap: 6 },
        { skill: "customer_health_analysis", weightedGap: 5 },
        { skill: "data_interpretation", weightedGap: 1 },
        { skill: "crm_hygiene", weightedGap: 0.4 },
      ],
      5,
    );
    expect(alloc.reduce((s, a) => s + a.count, 0)).toBe(5);
    expect(alloc.map((a) => a.skill)).toContain("data_interpretation");
  });
});

describe("single-stage exercises", () => {
  it("scores the AI draft review from the actual flags", () => {
    const perfect = scoreDraftReview({ flagged: ["s2", "s3", "s4"], decisionId: "edit", replacementId: "r1" });
    const careless = scoreDraftReview({ flagged: [], decisionId: "send", replacementId: "r2" });
    const overflagged = scoreDraftReview({ flagged: ["s1", "s2", "s3", "s4", "s5"], decisionId: "edit", replacementId: "r1" });
    expect(perfect.total).toBe(100);
    expect(careless.total).toBe(0);
    expect(overflagged.total).toBeLessThan(perfect.total);
  });

  it("scores the ops exercise from computed hours", () => {
    const best = scoreOps({ categoryId: "damage_claims", hoursEstimate: 28, metricId: "hours", caveatId: "measured" });
    const volumeTrap = scoreOps({ categoryId: "password", hoursEstimate: 20, metricId: "ticket_count", caveatId: "none" });
    expect(best.total).toBe(100);
    expect(volumeTrap.total).toBeLessThan(50);
  });
});
