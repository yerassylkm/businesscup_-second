/**
 * Plan catalog: the single source for names, prices and what each plan
 * unlocks. Prices are hypotheses being tested with US users.
 */
export type PaidTier = "journey" | "plus";

export const PLANS = {
  free: {
    name: "Free",
    price: "$0",
    cadence: "",
    summary: "Career diagnostics, a preliminary route and one practice challenge.",
    features: [
      "Career diagnostics: a 2-minute check based on your real tasks",
      "Task Transformation Map and your skill profile",
      "Preliminary route: three paths with skill overlap, gaps and effort",
      "One practice challenge on your path (Pivot: the full before → after cycle)",
      "Week 1 starter session, weekly reviews and 1 Career Radar signal",
    ],
  },
  journey: {
    name: "Skill Journey",
    price: "$34.99",
    cadence: "one-time",
    summary: "The full path for one skill: diagnosis → learning → practice → independent check. Yours to keep.",
    features: [
      "The full path for one skill: diagnosis → learning → practice → independent check",
      "Your complete personalized 14-day plan for that path, every session unlocked",
      "Deep skill-gap map and a printable / savable report (PDF via your browser)",
      "You keep access to the module you bought",
    ],
  },
  plus: {
    name: "shifto Plus",
    price: "$19.99",
    cadence: "per month",
    summary: "New programs, weekly Skill Sprints, career plan updates and Career Radar while you're subscribed.",
    features: [
      "Full plans on every path, so you can develop in several directions",
      "Career Radar: every curated signal for your path, updated with the catalog",
      "Weekly Skill Sprints: new practice simulations each week",
      "Career plan updates and saved progress while you're subscribed",
    ],
  },
} as const;

/** e.g. "$19.99/month" */
export function priceLabel(tier: PaidTier) {
  const p = PLANS[tier];
  return tier === "plus" ? `${p.price}/month` : `${p.price} ${p.cadence}`;
}
