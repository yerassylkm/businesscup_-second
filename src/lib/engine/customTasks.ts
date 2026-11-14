import type { SkillId, TaskCategory } from "@/types";

/**
 * Explainable keyword mapping for free-text custom tasks.
 * Each rule lists keywords, the skills they imply (2 = primary, 1 = secondary)
 * and the editorial task category. The rule with the most keyword hits wins
 * the category; skills from every matching rule are merged.
 * If nothing matches, the task is shown as "not classified" and does not
 * influence any score. We don't guess.
 */
interface KeywordRule {
  id: string;
  keywords: string[];
  skills: Partial<Record<SkillId, 1 | 2>>;
  category: TaskCategory;
}

export const KEYWORD_RULES: KeywordRule[] = [
  {
    id: "retention",
    keywords: ["refund", "billing", "cancel", "cancellation", "retention", "renew", "renewal", "churn", "save"],
    skills: { churn_prevention: 2, conflict_resolution: 1 },
    category: "human_led",
  },
  {
    id: "conflict",
    keywords: ["angry", "upset", "escalat", "complain", "de-escalat", "difficult", "frustrated"],
    skills: { conflict_resolution: 2, customer_communication: 1 },
    category: "human_led",
  },
  {
    id: "accounts",
    keywords: ["account health", "usage", "adoption", "upsell", "customer success", "qbr", "onboard customer", "check-in", "check in"],
    skills: { customer_health_analysis: 2, churn_prevention: 1 },
    category: "human_led",
  },
  {
    id: "stakeholders",
    keywords: ["train", "mentor", "coach", "stakeholder", "engineering", "product team", "manager", "meeting", "present", "onboard"],
    skills: { stakeholder_communication: 2 },
    category: "human_led",
  },
  {
    id: "data",
    keywords: ["report", "dashboard", "metric", "data", "analy", "spreadsheet", "excel", "sql", "trend", "kpi"],
    skills: { data_interpretation: 2 },
    category: "ai_augmented",
  },
  {
    id: "automation",
    keywords: ["automat", "macro", "workflow", "zapier", "script", "template", "process"],
    skills: { process_automation: 2 },
    category: "ai_augmented",
  },
  {
    id: "ai",
    keywords: ["ai", "chatgpt", "bot", "chatbot", "copilot", "gpt", "llm", "prompt"],
    skills: { ai_output_verification: 2 },
    category: "ai_augmented",
  },
  {
    id: "prioritization",
    keywords: ["prioriti", "triage", "queue", "sla", "backlog", "schedul", "dispatch"],
    skills: { prioritization: 2 },
    category: "ai_augmented",
  },
  {
    id: "records",
    keywords: ["crm", "salesforce", "zendesk", "hubspot", "record", "notes", "data entry", "tag", "log"],
    skills: { crm_hygiene: 2 },
    category: "automation_exposed",
  },
  {
    id: "routine_contact",
    keywords: ["email", "chat", "phone", "call", "reply", "respond", "answer", "ticket", "question", "inquir", "password", "status"],
    skills: { customer_communication: 2 },
    category: "automation_exposed",
  },
];

function countHits(text: string, keyword: string): number {
  // Short keywords (e.g. "ai", "sla") must match as whole words to avoid
  // false hits like "ai" inside "maintain".
  if (keyword.length <= 3) {
    const re = new RegExp(`\\b${keyword}\\b`, "i");
    return re.test(text) ? 1 : 0;
  }
  return text.includes(keyword) ? 1 : 0;
}

export interface CustomTaskMapping {
  text: string;
  category: TaskCategory | null;
  skills: Partial<Record<SkillId, 1 | 2>>;
  matchedRules: string[];
  matchedKeywords: string[];
}

export function mapCustomTask(raw: string): CustomTaskMapping {
  const text = raw.toLowerCase();
  let best: { rule: KeywordRule; hits: number } | null = null;
  const skills: Partial<Record<SkillId, 1 | 2>> = {};
  const matchedRules: string[] = [];
  const matchedKeywords: string[] = [];

  for (const rule of KEYWORD_RULES) {
    const hitWords = rule.keywords.filter((k) => countHits(text, k) > 0);
    if (hitWords.length === 0) continue;
    matchedRules.push(rule.id);
    matchedKeywords.push(...hitWords);
    for (const [skill, weight] of Object.entries(rule.skills) as [SkillId, 1 | 2][]) {
      skills[skill] = Math.max(skills[skill] ?? 0, weight) as 1 | 2;
    }
    // Rules earlier in the list win ties (they describe more specific work).
    if (!best || hitWords.length > best.hits) best = { rule, hits: hitWords.length };
  }

  return { text: raw.trim(), category: best?.rule.category ?? null, skills, matchedRules, matchedKeywords };
}
