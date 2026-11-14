import { describe, expect, it } from "vitest";
import { SCENARIO_BASELINE, SCENARIO_SPRINT, SCENARIO_TRANSFER } from "@/lib/data/scenarios";
import { primaryRisk, rankAccounts, scoreMessage, scorePortfolio } from "@/lib/engine/portfolio";
import type { PortfolioAnswer } from "@/types";

const GOOD_MESSAGE =
  "Hi Sam, I noticed weekly logins on your team dropped by about 40% this month. I'd like to make sure we still support your goals. Could we book 20 minutes on Thursday to review usage and agree on a plan?";

describe("account ranking is derived from the data", () => {
  it("ranks the quiet, sponsor-less account first in portfolio A", () => {
    const ranked = rankAccounts(SCENARIO_BASELINE).map((r) => r.account.id);
    expect(ranked[0]).toBe("a1");
    expect(ranked.at(-1)).toBe("a3"); // healthy expansion account
  });

  it("ranks the high-value adoption decline first in portfolio B (not the soonest renewal)", () => {
    const ranked = rankAccounts(SCENARIO_TRANSFER).map((r) => r.account.id);
    expect(ranked[0]).toBe("b1");
    expect(ranked.indexOf("b2")).toBeGreaterThan(2); // renews soonest but is healthy
  });

  it("has a distinct top account in the sprint portfolio", () => {
    expect(rankAccounts(SCENARIO_SPRINT)[0].account.id).toBe("c3");
  });

  it("derives risk types from signals", () => {
    const a1 = SCENARIO_BASELINE.accounts.find((a) => a.id === "a1")!;
    const a3 = SCENARIO_BASELINE.accounts.find((a) => a.id === "a3")!;
    expect(primaryRisk(a1)).toBe("relationship");
    expect(primaryRisk(a3)).toBe("expansion");
  });
});

describe("scorePortfolio", () => {
  const strong: PortfolioAnswer = {
    accountId: "a1",
    signals: ["usage_drop", "renewal_soon", "champion_left", "high_arr"],
    risk: "relationship",
    actionId: "meet_new_sponsor",
    message: GOOD_MESSAGE,
  };

  it("gives a strong, evidence-based answer a high score", () => {
    const r = scorePortfolio(SCENARIO_BASELINE, strong);
    expect(r.total).toBeGreaterThanOrEqual(90);
    expect(r.chosenRank).toBe(1);
  });

  it("scores a loud-but-wrong choice lower, with specific feedback", () => {
    const weak: PortfolioAnswer = {
      accountId: "a2",
      signals: ["ticket_volume", "negative_sentiment"],
      risk: "service",
      actionId: "discount",
      message: "Hi, your renewal is coming up, we can give you a discount if you renew now.",
    };
    const r = scorePortfolio(SCENARIO_BASELINE, weak);
    expect(r.total).toBeLessThan(40);
    const prio = r.dimensions.find((d) => d.id === "prioritization")!;
    expect(prio.feedback).toContain("Harbor Dental Group");
    expect(prio.feedback).toContain("volume alone");
  });

  it("changes the score when only one answer changes (no fixed outcome)", () => {
    const a = scorePortfolio(SCENARIO_BASELINE, strong).total;
    const b = scorePortfolio(SCENARIO_BASELINE, { ...strong, actionId: "discount" }).total;
    const c = scorePortfolio(SCENARIO_BASELINE, { ...strong, accountId: "a4" }).total;
    expect(b).toBeLessThan(a);
    expect(c).toBeLessThan(a);
  });

  it("penalizes evidence that is false for the chosen account", () => {
    const honest = scorePortfolio(SCENARIO_BASELINE, strong);
    const padded = scorePortfolio(SCENARIO_BASELINE, { ...strong, signals: [...strong.signals, "negative_sentiment", "detractor"] });
    const ev = (r: typeof honest) => r.dimensions.find((d) => d.id === "evidence")!.points;
    expect(ev(padded)).toBeLessThan(ev(honest));
  });

  it("uses the same engine for transfer: the baseline's right answer is wrong here", () => {
    const r = scorePortfolio(SCENARIO_TRANSFER, { ...strong, accountId: "b2", signals: ["renewal_soon"], risk: "routine_renewal" });
    expect(r.chosenRank).toBeGreaterThan(1);
    expect(r.total).toBeLessThan(scorePortfolio(SCENARIO_TRANSFER, { ...strong, accountId: "b1", signals: ["usage_drop", "negative_sentiment", "low_seat_use", "detractor", "high_arr"], risk: "adoption", actionId: "adoption_review" }).total);
  });

  it("produces skill evidence between 0 and 1", () => {
    const r = scorePortfolio(SCENARIO_BASELINE, strong);
    for (const v of Object.values(r.skillEvidence)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("scoreMessage heuristic", () => {
  it("passes all four checks for a strong message", () => {
    expect(scoreMessage(GOOD_MESSAGE).points).toBe(8);
  });
  it("refuses to score very short messages", () => {
    const r = scoreMessage("Just checking in!");
    expect(r.tooShort).toBe(true);
    expect(r.points).toBe(0);
  });
  it("flags discount-first pressure", () => {
    const r = scoreMessage("Hi team, your renewal is close and I can offer a discount if you renew now this week, let me know about your goals and usage.");
    expect(r.checks.find((c) => c.id === "no_pressure")!.passed).toBe(false);
  });
});
