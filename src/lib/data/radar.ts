import type { PathId, SkillId } from "@/types";
import { CATALOG_DATE, CATALOG_VERSION } from "./sources";

/**
 * Career Radar: curated editorial signals about how work around each path is
 * changing (catalog v1).
 *
 * Rules for this file:
 *   - Plain editorial statements only. No statistics, percentages, salaries,
 *     forecasts or claimed sources.
 *   - Every signal links to one skill and to a real page in the product
 *     (an exercise, a challenge or the user's plan).
 * The radar is a curated snapshot updated with the catalog. It is not a live
 * labor-market feed and not a job-loss forecast.
 */

export const RADAR_AS_OF = CATALOG_DATE;
export const RADAR_VERSION = CATALOG_VERSION;

export interface RadarCta {
  label: string;
  /** Absolute app path. `{path}` is replaced with the user's selected path id. */
  href: string;
}

export interface RadarSignal {
  id: string;
  asOf: string;
  title: string;
  whatsChanging: string;
  whatItMeans: string;
  skill: SkillId;
  cta: RadarCta;
}

export const RADAR_SIGNALS: Record<string, RadarSignal> = {
  "ai-agents-repetitive": {
    id: "ai-agents-repetitive",
    asOf: RADAR_AS_OF,
    title: "AI agents are taking on repetitive tickets",
    whatsChanging:
      "Routine how-to, password and status questions are increasingly answered by self-service and AI agents before they reach a person.",
    whatItMeans:
      "Someone still has to check what automated answers tell customers. Practice spotting confident but wrong AI replies.",
    skill: "ai_output_verification",
    cta: { label: "Start the AI draft review", href: "/challenge/ai-draft-review" },
  },
  "human-escalations": {
    id: "human-escalations",
    asOf: RADAR_AS_OF,
    title: "What reaches people is getting harder",
    whatsChanging:
      "As routine contacts move to automation, the conversations left for human agents tend to be the complex, emotional or high-stakes ones.",
    whatItMeans:
      "De-escalation and judgment become a bigger share of the job. Your plan's conflict-resolution sessions target this.",
    skill: "conflict_resolution",
    cta: { label: "Open my plan", href: "/path/{path}" },
  },
  "ai-case-notes": {
    id: "ai-case-notes",
    asOf: RADAR_AS_OF,
    title: "AI summaries are changing case notes",
    whatsChanging: "Ticket and call summaries are increasingly drafted automatically inside support and CRM tools.",
    whatItMeans:
      "Notes still need a human check for what was promised and what happens next. Clean records matter more when others act on them.",
    skill: "crm_hygiene",
    cta: { label: "Open my plan", href: "/path/{path}" },
  },
  "frontline-automation": {
    id: "frontline-automation",
    asOf: RADAR_AS_OF,
    title: "Automation ideas are coming from the front line",
    whatsChanging:
      "No-code workflow, macro and routing tools make it easier for non-engineers to automate repetitive steps.",
    whatItMeans:
      "A proposal is credible when you can estimate the hours it saves. Practice sizing an automation from real-looking ticket data.",
    skill: "process_automation",
    cta: { label: "Start the ops analysis", href: "/challenge/ops-volume" },
  },
  "proactive-retention": {
    id: "proactive-retention",
    asOf: RADAR_AS_OF,
    title: "Retention work is moving earlier",
    whatsChanging:
      "Subscription businesses put more emphasis on spotting churn signals before a customer asks to cancel, not after.",
    whatItMeans:
      "Reading account health is a core Customer Success skill, and support people already see many of the signals. Prove it on a portfolio.",
    skill: "customer_health_analysis",
    cta: { label: "Start the portfolio challenge", href: "/challenge/cs-portfolio" },
  },
  "sponsor-changes": {
    id: "sponsor-changes",
    asOf: RADAR_AS_OF,
    title: "Sponsor changes are a recurring renewal risk",
    whatsChanging:
      "When the person who bought a product leaves, the renewal can lose its internal champion, often without any support ticket.",
    whatItMeans:
      "Practice finding and re-engaging new decision-makers. Your plan's stakeholder sessions cover mapping who decides.",
    skill: "stakeholder_communication",
    cta: { label: "Open my plan", href: "/path/{path}" },
  },
  "evidence-over-anecdotes": {
    id: "evidence-over-anecdotes",
    asOf: RADAR_AS_OF,
    title: "Decisions increasingly need evidence",
    whatsChanging:
      "Support and operations teams commonly work from dashboards, and proposals are expected to reference rates and trends rather than anecdotes.",
    whatItMeans: "Practice turning raw counts into a clear, numbers-backed recommendation.",
    skill: "data_interpretation",
    cta: { label: "Start the ops analysis", href: "/challenge/ops-volume" },
  },
  "work-samples": {
    id: "work-samples",
    asOf: RADAR_AS_OF,
    title: "Career switchers are asked for work samples",
    whatsChanging:
      "For analysis roles, hiring conversations often focus on concrete examples of analysis someone has actually done.",
    whatItMeans:
      "Build one small analysis from your own team's data. Your plan's portfolio sessions walk through it step by step.",
    skill: "data_interpretation",
    cta: { label: "Open my plan", href: "/path/{path}" },
  },
};

/**
 * Signals shown per path, in priority order (4–5 each).
 * The first signal for a path is the free one; the rest are Plus.
 */
export const RADAR_BY_PATH: Record<PathId, string[]> = {
  adapt: ["ai-agents-repetitive", "human-escalations", "ai-case-notes", "frontline-automation"],
  pivot: ["proactive-retention", "sponsor-changes", "ai-agents-repetitive", "evidence-over-anecdotes", "ai-case-notes"],
  reinvent: ["frontline-automation", "evidence-over-anecdotes", "work-samples", "ai-agents-repetitive"],
};

export const FREE_RADAR_SIGNALS = 1;
