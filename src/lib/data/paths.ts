import type { PathDef, PathId } from "@/types";

/**
 * The three career directions shown to every user. Targets reference
 * role profiles in roles.ts; the engine computes overlap, gaps and effort
 * from the user's own inputs.
 */
export const PATHS: PathDef[] = [
  {
    id: "adapt",
    name: "Adapt",
    tagline: "Stay in your profession. Upgrade how you do it.",
    description:
      "Keep your current role and move toward the work that grows in value as AI handles routine tickets: supervising AI answers, owning complex cases and improving workflows.",
    targetRoleId: "ai_augmented_support_specialist",
    extraPrepHours: 0,
    entryPoints: [
      "Volunteer to review your team's chatbot or macro answers",
      "Own one recurring issue end to end and document the fix",
      "Propose one workflow automation with a before/after estimate",
    ],
    uncertainty:
      "Lowest switching cost, but your role's day-to-day keeps changing. How much depends on your employer's tooling choices.",
    firstChallengeId: "ai-draft-review",
  },
  {
    id: "pivot",
    name: "Pivot",
    tagline: "Move next door. Keep most of what you know.",
    description:
      "Shift from reactive support to proactive Customer Success: managing a portfolio of accounts, reading health signals and preventing churn. Your customer empathy and product knowledge carry over directly.",
    targetRoleId: "customer_success_specialist",
    extraPrepHours: 10,
    extraPrepLabel: "Write 2 customer-success case notes from your own work (portfolio evidence)",
    entryPoints: [
      "Ask to shadow a Customer Success Manager on two renewal calls",
      "Flag at-risk accounts you notice in support tickets, with evidence",
      "Build a simple account-health checklist for your top customers",
    ],
    uncertainty:
      "Adjacent move with strong overlap, but hiring managers will look for proof of proactive, commercial judgment, not only ticket handling.",
    firstChallengeId: "cs-portfolio",
  },
  {
    id: "reinvent",
    name: "Reinvent",
    tagline: "Explore a bigger change, with eyes open.",
    description:
      "Move toward operations analysis: using data to find bottlenecks and quantify improvements. Your frontline knowledge of where processes break is a real asset, but this path needs more preparation.",
    targetRoleId: "operations_analyst",
    steppingStoneRoleId: "operations_coordinator",
    extraPrepHours: 40,
    extraPrepLabel: "Build a spreadsheet/SQL analysis portfolio project (about 40 hours)",
    entryPoints: [
      "Rebuild one support report yourself from raw ticket exports",
      "Learn spreadsheet pivots and basic SQL on your own team's data",
      "Quantify one process problem in hours or dollars and present it",
    ],
    uncertainty:
      "Largest skill gap and the least certain outcome. Many people take a stepping-stone role (such as support operations) first.",
    warning:
      "This is not an easy or guaranteed switch. Expect additional preparation such as a portfolio or a course, and possibly an entry-level start.",
    firstChallengeId: "ops-volume",
  },
];

export const PATH_BY_ID: Record<PathId, PathDef> = Object.fromEntries(PATHS.map((p) => [p.id, p])) as Record<
  PathId,
  PathDef
>;

export const PATH_IDS: PathId[] = ["adapt", "pivot", "reinvent"];

export function isPathId(value: string): value is PathId {
  return (PATH_IDS as string[]).includes(value);
}
