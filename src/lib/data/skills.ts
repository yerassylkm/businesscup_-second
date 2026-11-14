import type { Skill, SkillId } from "@/types";

/**
 * Curated skill catalog (v1, Nov 2026).
 * `hoursPerLevel` is a PIVOTREADY planning estimate used to size roadmaps.
 * It is editorial, not a validated learning-science figure.
 */
export const SKILLS: Skill[] = [
  {
    id: "customer_communication",
    name: "Customer communication",
    description: "Clear, empathetic written and spoken communication with customers.",
    hoursPerLevel: 8,
  },
  {
    id: "conflict_resolution",
    name: "Conflict resolution",
    description: "De-escalating frustrated customers and finding fair resolutions.",
    hoursPerLevel: 8,
  },
  {
    id: "customer_health_analysis",
    name: "Customer health analysis",
    description: "Reading usage, sentiment and renewal signals to judge account health.",
    hoursPerLevel: 10,
  },
  {
    id: "crm_hygiene",
    name: "CRM hygiene",
    description: "Keeping customer records, notes and fields accurate and useful.",
    hoursPerLevel: 5,
  },
  {
    id: "churn_prevention",
    name: "Churn prevention",
    description: "Spotting cancellation risk early and acting on its root cause.",
    hoursPerLevel: 10,
  },
  {
    id: "data_interpretation",
    name: "Data interpretation",
    description: "Turning tables, trends and metrics into sound conclusions.",
    hoursPerLevel: 14,
  },
  {
    id: "process_automation",
    name: "Process automation",
    description: "Designing workflows, macros and automations that remove repetitive work.",
    hoursPerLevel: 12,
  },
  {
    id: "ai_output_verification",
    name: "AI output verification",
    description: "Checking AI-drafted answers for accuracy, policy fit and tone before use.",
    hoursPerLevel: 6,
  },
  {
    id: "prioritization",
    name: "Prioritization",
    description: "Deciding what matters most when everything looks urgent.",
    hoursPerLevel: 6,
  },
  {
    id: "stakeholder_communication",
    name: "Stakeholder communication",
    description: "Aligning decision-makers, internal teams and customers on next steps.",
    hoursPerLevel: 8,
  },
];

export const SKILL_IDS = SKILLS.map((s) => s.id) as SkillId[];

export const SKILL_BY_ID: Record<SkillId, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
) as Record<SkillId, Skill>;

export const LEVEL_LABELS = ["Not yet", "Basic", "Working", "Strong", "Expert"] as const;

export function levelLabel(level: number) {
  return LEVEL_LABELS[Math.max(0, Math.min(4, Math.round(level)))];
}
