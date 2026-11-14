import type { TaskCategory, TaskDef } from "@/types";

/**
 * Curated daily tasks for customer-facing support work (v1, Nov 2026).
 *
 * The category of each task is PIVOTREADY's editorial judgment of how the task
 * tends to change as AI tools and self-service spread:
 *   - automation_exposed: repetitive, rules-based, increasingly handled by
 *     self-service, routing rules or AI agents.
 *   - ai_augmented: still done by people, but AI tools change how (drafting,
 *     summarizing, searching), so the skill shifts toward reviewing and steering.
 *   - human_led: relies on judgment, trust or negotiation that customers and
 *     employers still expect a person to own.
 * These are NOT probabilities of job loss and are not derived from a labor-market
 * dataset. They are explained, reviewable heuristics.
 */
export const TASKS: TaskDef[] = [
  {
    id: "faq_tickets",
    label: "Answer repetitive how-to and password-reset tickets",
    category: "automation_exposed",
    changeSignal: "Common questions with documented answers are the first thing self-service and AI agents take over.",
    skills: { customer_communication: 2 },
  },
  {
    id: "triage_routing",
    label: "Tag, route and triage incoming tickets",
    category: "automation_exposed",
    changeSignal: "Rules-based classification is increasingly done by routing rules and AI classifiers.",
    skills: { crm_hygiene: 2, prioritization: 1 },
  },
  {
    id: "crm_updates",
    label: "Update customer records and case notes",
    category: "automation_exposed",
    changeSignal: "Note-taking and field updates are being automated by summarization and integrations.",
    skills: { crm_hygiene: 2 },
  },
  {
    id: "order_status",
    label: "Look up order, billing or account status for customers",
    category: "automation_exposed",
    changeSignal: "Status lookups are straightforward to expose through self-service portals and bots.",
    skills: { customer_communication: 1, crm_hygiene: 1 },
  },
  {
    id: "draft_with_ai",
    label: "Draft replies using knowledge-base search or AI suggestions",
    category: "ai_augmented",
    changeSignal: "The drafting moves to AI; the human value shifts to checking accuracy, tone and policy.",
    skills: { ai_output_verification: 2, customer_communication: 1 },
  },
  {
    id: "macros_kb",
    label: "Write macros, canned responses or help-center articles",
    category: "ai_augmented",
    changeSignal: "AI speeds up writing, but deciding what to standardize is a process-design skill.",
    skills: { process_automation: 2, customer_communication: 1 },
  },
  {
    id: "review_bot",
    label: "Review chatbot or AI-agent answers for accuracy",
    category: "ai_augmented",
    changeSignal: "A growing task: someone has to audit what automated systems tell customers.",
    skills: { ai_output_verification: 2, data_interpretation: 1 },
  },
  {
    id: "queue_metrics",
    label: "Monitor queue, SLA or CSAT metrics",
    category: "ai_augmented",
    changeSignal: "Dashboards are automated; interpreting them and acting is the human part.",
    skills: { data_interpretation: 2, prioritization: 1 },
  },
  {
    id: "trend_reports",
    label: "Spot recurring issues and report trends to product teams",
    category: "ai_augmented",
    changeSignal: "AI can cluster tickets, but turning patterns into a persuasive case still needs a person.",
    skills: { data_interpretation: 2, stakeholder_communication: 1, customer_health_analysis: 1 },
  },
  {
    id: "deescalation",
    label: "De-escalate frustrated or angry customers",
    category: "human_led",
    changeSignal: "Emotional, high-stakes conversations are where customers most expect a person.",
    skills: { conflict_resolution: 2, customer_communication: 2 },
  },
  {
    id: "complex_issues",
    label: "Investigate complex issues and coordinate with engineering",
    category: "human_led",
    changeSignal: "Ambiguous, multi-team problems need ownership and judgment.",
    skills: { stakeholder_communication: 2, data_interpretation: 1, prioritization: 1 },
  },
  {
    id: "billing_disputes",
    label: "Handle billing disputes, refunds and cancellation requests",
    category: "human_led",
    changeSignal: "Retention conversations involve negotiation and policy judgment.",
    skills: { churn_prevention: 2, conflict_resolution: 1 },
  },
  {
    id: "at_risk_followup",
    label: "Follow up with unhappy or at-risk customers",
    category: "human_led",
    changeSignal: "Proactive outreach based on account signals is the core of customer success work.",
    skills: { churn_prevention: 2, customer_health_analysis: 2, customer_communication: 1 },
  },
  {
    id: "train_teammates",
    label: "Train or mentor new teammates",
    category: "human_led",
    changeSignal: "Coaching and judgment transfer remain people-led.",
    skills: { stakeholder_communication: 2, customer_communication: 1 },
  },
];

export const TASK_BY_ID: Record<string, TaskDef> = Object.fromEntries(TASKS.map((t) => [t.id, t]));

export const CATEGORY_META: Record<TaskCategory, { label: string; short: string; description: string }> = {
  automation_exposed: {
    label: "Automation-exposed",
    short: "Shifting to automation",
    description: "Repetitive, rules-based work that self-service and AI tools increasingly handle.",
  },
  ai_augmented: {
    label: "AI-augmented",
    short: "Changing with AI",
    description: "Still people-owned, but AI changes how it is done. Reviewing and steering matter more.",
  },
  human_led: {
    label: "Human-led",
    short: "Judgment-heavy",
    description: "Relies on judgment, trust and negotiation. Your most durable strengths today.",
  },
};
