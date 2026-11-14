import { describe, expect, it } from "vitest";
import { SAMPLE_ASSESSMENT } from "@/lib/data/presets";
import { SCENARIO_BASELINE, SCENARIO_TRANSFER } from "@/lib/data/scenarios";
import { scorePortfolio } from "@/lib/engine/portfolio";
import { profileUpdate } from "@/lib/engine/progress";
import type { ChallengeAttempt, PortfolioAnswer } from "@/types";

const WEAK: PortfolioAnswer = {
  accountId: "a2",
  signals: ["ticket_volume"],
  risk: "service",
  actionId: "discount",
  message: "Hi, we can give you a discount if you renew now.",
};
const STRONG: PortfolioAnswer = {
  accountId: "b1",
  signals: ["usage_drop", "negative_sentiment", "low_seat_use", "detractor", "high_arr"],
  risk: "adoption",
  actionId: "adoption_review",
  message:
    "Hi Morgan, I noticed weekly usage dropped 35% this month. Could we book 30 minutes on Thursday to review your goals and agree on a plan?",
};

function attempt(stage: "baseline" | "transfer", answer: PortfolioAnswer, at: number): ChallengeAttempt {
  const r = scorePortfolio(stage === "baseline" ? SCENARIO_BASELINE : SCENARIO_TRANSFER, answer);
  return {
    id: `cs-${stage}-${at}`,
    challengeId: "cs-portfolio",
    scenarioId: stage,
    stage,
    pathId: "pivot",
    at,
    total: r.total,
    max: r.max,
    dimensions: r.dimensions,
    skillEvidence: r.skillEvidence,
    answer,
  };
}

describe("profileUpdate", () => {
  const baseline = attempt("baseline", WEAK, 1000);
  const transfer = attempt("transfer", STRONG, 2000);

  it("uses the self-rating as 'before' for a first measurement", () => {
    const u = profileUpdate(SAMPLE_ASSESSMENT, [baseline], baseline.id, "pivot")!;
    const health = u.skills.find((s) => s.skill === "customer_health_analysis")!;
    expect(health.before).toEqual({ source: "self", level: SAMPLE_ASSESSMENT.selfSkills.customer_health_analysis });
  });

  it("compares measured before → after across attempts and shows the gap shrinking", () => {
    const u = profileUpdate(SAMPLE_ASSESSMENT, [baseline, transfer], transfer.id, "pivot")!;
    const health = u.skills.find((s) => s.skill === "customer_health_analysis")!;
    expect(health.before.source).toBe("measured");
    expect(health.after).toBeGreaterThan(health.before.level!);
    expect(health.gapAfter!).toBeLessThan(health.gapBefore!);
    expect(u.shrunkGaps.map((s) => s.skill)).toContain("customer_health_analysis");
    expect(u.roleTitle).toBe("Customer Success Specialist");
  });

  it("reports a weaker attempt honestly (no fake improvement)", () => {
    const strongFirst = attempt("transfer", STRONG, 1000);
    const weakLater = attempt("baseline", WEAK, 2000);
    const u = profileUpdate(SAMPLE_ASSESSMENT, [strongFirst, weakLater], weakLater.id, "pivot")!;
    const prio = u.skills.find((s) => s.skill === "prioritization")!;
    expect(prio.after).toBeLessThan(prio.before.level!);
    expect(u.shrunkGaps.find((s) => s.skill === "prioritization")).toBeUndefined();
  });

  it("works without an assessment (no gap information)", () => {
    const u = profileUpdate(null, [baseline], baseline.id, "pivot")!;
    expect(u.skills.every((s) => s.before.source === "none" && s.gapBefore === null)).toBe(true);
  });

  it("returns null for an unknown attempt", () => {
    expect(profileUpdate(SAMPLE_ASSESSMENT, [baseline], "nope", "pivot")).toBeNull();
  });
});
