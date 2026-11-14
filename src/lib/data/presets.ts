import type { AssessmentInput } from "@/types";

/**
 * Sample journey preset: "Sarah", a fictional, illustrative persona
 * (not a researched customer). This is only an input preset. It flows through
 * exactly the same validation, scoring and planning code as a real user.
 */
export const SAMPLE_PERSONA = {
  name: "Sarah (fictional sample)",
  blurb:
    "34, Customer Support Specialist for 8 years, has 3–5 hours a week. Worried that AI is automating her repetitive tasks, she wants to grow beyond reactive support into a related role.",
};

export const SAMPLE_ASSESSMENT: AssessmentInput = {
  roleChoice: "customer_support_specialist",
  experience: "5to10",
  taskIds: ["faq_tickets", "triage_routing", "crm_updates", "draft_with_ai", "deescalation", "billing_disputes", "trend_reports"],
  customTasks: [],
  concern: "ai_changing_tasks",
  selfSkills: {
    customer_communication: 3,
    conflict_resolution: 3,
    customer_health_analysis: 1,
    crm_hygiene: 2,
    churn_prevention: 1,
    data_interpretation: 1,
    process_automation: 1,
    ai_output_verification: 1,
    prioritization: 2,
    stakeholder_communication: 2,
  },
  // Goal: move into a related role (Pivot). The recommendation is still computed
  // by the engine from these inputs. Nothing about the result is hardcoded.
  goal: "pivot",
  weeklyTime: "3to5",
  budget: "under25",
  incomePreference: "keep_level",
  isSample: true,
};
