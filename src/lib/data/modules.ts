import type { SkillId } from "@/types";

/**
 * Authored roadmap modules. The plan generator picks modules for the user's
 * largest weighted skill gaps, in order: learn → practice → apply.
 * Each module is a concrete activity the user can do in their real job or
 * with public tools; the app records completion and an optional note.
 */
export type ModuleKind = "learn" | "practice" | "apply";

export interface ModuleDef {
  id: string;
  skill: SkillId;
  kind: ModuleKind;
  title: string;
  outcome: string;
  steps: string[];
}

export const MODULES: ModuleDef[] = [
  // Customer communication
  {
    id: "cc-1",
    skill: "customer_communication",
    kind: "learn",
    title: "The 4-part reply: acknowledge, answer, next step, owner",
    outcome: "You can structure any customer reply so it is clear on the first read.",
    steps: [
      "Pick three replies you sent this week.",
      "Mark where each one acknowledges, answers, sets a next step and names who owns it.",
      "Rewrite the weakest reply so all four parts are present in under 120 words.",
    ],
  },
  {
    id: "cc-2",
    skill: "customer_communication",
    kind: "practice",
    title: "Plain-language rewrite drill",
    outcome: "You remove jargon and passive voice without losing accuracy.",
    steps: [
      "Take one help-center article or macro your team uses.",
      "Rewrite it at a reading level a busy customer can skim (short sentences, active voice).",
      "Ask a teammate which version they would rather receive and why.",
    ],
  },
  {
    id: "cc-3",
    skill: "customer_communication",
    kind: "apply",
    title: "Proactive update template",
    outcome: "You have a reusable message for telling customers about delays before they ask.",
    steps: [
      "Write a template for a proactive delay update: what happened, impact, what you're doing, when they'll hear next.",
      "Use it once on a real case this week.",
      "Note the customer's response in your plan notes.",
    ],
  },
  // Conflict resolution
  {
    id: "cr-1",
    skill: "conflict_resolution",
    kind: "learn",
    title: "Separate the emotion from the request",
    outcome: "You can name what the customer feels and what they actually need.",
    steps: [
      "Review two escalated conversations from your queue.",
      "For each, write one line on the emotion and one line on the underlying request.",
      "Check whether your reply addressed both or only the request.",
    ],
  },
  {
    id: "cr-2",
    skill: "conflict_resolution",
    kind: "practice",
    title: "Options, not ultimatums",
    outcome: "You offer two acceptable options instead of a single 'no'.",
    steps: [
      "List three requests you usually have to decline.",
      "For each, write two alternatives you are allowed to offer.",
      "Turn the best one into a saved reply.",
    ],
  },
  {
    id: "cr-3",
    skill: "conflict_resolution",
    kind: "apply",
    title: "Post-escalation review",
    outcome: "You turn one tough conversation into a process improvement.",
    steps: [
      "Pick a recent escalation.",
      "Write what triggered it, what calmed it and what could prevent it next time.",
      "Share the prevention idea with your lead.",
    ],
  },
  // Customer health analysis
  {
    id: "ch-1",
    skill: "customer_health_analysis",
    kind: "learn",
    title: "The five health signals",
    outcome: "You can name usage, renewal timing, sponsor, sentiment and seat use as health signals.",
    steps: [
      "Read the shifto micro-lesson on customer health (Pivot challenge, step 2).",
      "Write which of the five signals your company actually tracks today.",
      "Note one signal you can see in support tickets that customer success may not.",
    ],
  },
  {
    id: "ch-2",
    skill: "customer_health_analysis",
    kind: "practice",
    title: "Score three real accounts",
    outcome: "You can rank accounts by risk using evidence, not volume of noise.",
    steps: [
      "Pick three customers you know from support.",
      "Rate each on the five signals (green / yellow / red) using information you can access.",
      "Rank them and write one sentence of evidence for the top-risk account.",
    ],
  },
  {
    id: "ch-3",
    skill: "customer_health_analysis",
    kind: "apply",
    title: "Health check note for a CSM",
    outcome: "You produce a short, evidence-based risk note someone could act on.",
    steps: [
      "Write a 5-line note on one at-risk account: signals, likely cause, suggested action.",
      "Send it to a Customer Success colleague or keep it as portfolio evidence.",
      "Save the note text in your plan notes.",
    ],
  },
  // CRM hygiene
  {
    id: "crm-1",
    skill: "crm_hygiene",
    kind: "learn",
    title: "Notes that someone else can use",
    outcome: "Your case notes answer: what happened, what was promised, what's next.",
    steps: [
      "Open five of your recent case notes.",
      "Check each for the three questions above.",
      "Create a 3-line note template and use it for the rest of the week.",
    ],
  },
  {
    id: "crm-2",
    skill: "crm_hygiene",
    kind: "practice",
    title: "Field audit",
    outcome: "You find which fields are unreliable and why.",
    steps: [
      "List the 5 fields your team relies on most.",
      "Spot-check 10 records for missing or inconsistent values.",
      "Propose one rule that would fix the most common issue.",
    ],
  },
  {
    id: "crm-3",
    skill: "crm_hygiene",
    kind: "apply",
    title: "Tag taxonomy cleanup",
    outcome: "You can propose a cleaner tag set that makes reporting possible.",
    steps: [
      "Export or list your team's ticket tags.",
      "Merge duplicates and near-duplicates into a proposed shorter list.",
      "Estimate how reporting would improve and share the proposal.",
    ],
  },
  // Churn prevention
  {
    id: "cp-1",
    skill: "churn_prevention",
    kind: "learn",
    title: "Root cause before rescue",
    outcome: "You can tell adoption, relationship and service churn apart.",
    steps: [
      "Read the 'avoid discount-first saves' section of the Pivot micro-lesson.",
      "Recall two customers who cancelled and label each by root cause.",
      "Write which action would have addressed that cause.",
    ],
  },
  {
    id: "cp-2",
    skill: "churn_prevention",
    kind: "practice",
    title: "Save conversation script",
    outcome: "You have a non-pushy script for cancellation conversations.",
    steps: [
      "Draft questions that uncover why the customer wants to leave.",
      "Map each likely reason to one offer that fixes the reason (not just price).",
      "Role-play it once with a colleague or out loud.",
    ],
  },
  {
    id: "cp-3",
    skill: "churn_prevention",
    kind: "apply",
    title: "Early-warning list",
    outcome: "You identify customers at risk before they ask to cancel.",
    steps: [
      "Search your tickets for phrases like 'cancel', 'alternative', 'too expensive' from the last 60 days.",
      "List the accounts and the signal you saw.",
      "Pick one and plan a proactive check-in.",
    ],
  },
  // Data interpretation
  {
    id: "di-1",
    skill: "data_interpretation",
    kind: "learn",
    title: "Rates, not raw counts",
    outcome: "You compare things fairly by normalizing numbers.",
    steps: [
      "Take one metric your team reports as a raw count (tickets, complaints).",
      "Convert it into a rate (per customer, per 100 orders, per agent hour).",
      "Write what changes in the story once it's a rate.",
    ],
  },
  {
    id: "di-2",
    skill: "data_interpretation",
    kind: "practice",
    title: "Spreadsheet pivot practice",
    outcome: "You can summarize a ticket export by category and week.",
    steps: [
      "Export (or recreate) a small ticket list with category and date.",
      "Build a pivot table: count by category by week.",
      "Write the single biggest change you see and one possible cause.",
    ],
  },
  {
    id: "di-3",
    skill: "data_interpretation",
    kind: "apply",
    title: "One-chart insight",
    outcome: "You present one finding with one chart and one recommendation.",
    steps: [
      "Pick the finding from your pivot practice.",
      "Make one clear chart with a headline that states the conclusion.",
      "Add one recommended action and share it with your lead.",
    ],
  },
  // Process automation
  {
    id: "pa-1",
    skill: "process_automation",
    kind: "learn",
    title: "Find the automation candidates",
    outcome: "You can spot work that is high-volume, repeatable and low-risk.",
    steps: [
      "List the 5 most common ticket types you handle.",
      "For each, estimate weekly volume and minutes per ticket.",
      "Mark which follow the same steps every time.",
    ],
  },
  {
    id: "pa-2",
    skill: "process_automation",
    kind: "practice",
    title: "Write the workflow spec",
    outcome: "You describe an automation precisely enough for someone to build it.",
    steps: [
      "Pick the best candidate from the previous module.",
      "Write trigger → conditions → actions → when a human takes over.",
      "List what could go wrong and how you'd detect it.",
    ],
  },
  {
    id: "pa-3",
    skill: "process_automation",
    kind: "apply",
    title: "Build or pitch one automation",
    outcome: "You ship (or formally propose) one automation with an hours-saved estimate.",
    steps: [
      "Build a macro, rule or saved workflow in your tools — or prepare a one-page pitch.",
      "Estimate hours saved per week: volume × minutes saved ÷ 60.",
      "Record the estimate in your plan notes.",
    ],
  },
  // AI output verification
  {
    id: "ai-1",
    skill: "ai_output_verification",
    kind: "learn",
    title: "The AI answer checklist",
    outcome: "You check AI drafts for facts, policy, completeness and tone.",
    steps: [
      "Read the AI draft review exercise feedback (Adapt path).",
      "Write a 4-item checklist you'll apply to every AI-drafted reply.",
      "Pin it where you work.",
    ],
  },
  {
    id: "ai-2",
    skill: "ai_output_verification",
    kind: "practice",
    title: "Catch the confident mistake",
    outcome: "You can find claims an AI states confidently but cannot know.",
    steps: [
      "Ask an AI assistant a policy question about a product you know well.",
      "Highlight every claim and verify each against your real documentation.",
      "Count how many were wrong or unverifiable.",
    ],
  },
  {
    id: "ai-3",
    skill: "ai_output_verification",
    kind: "apply",
    title: "Bot answer audit",
    outcome: "You produce an audit others can act on.",
    steps: [
      "Sample 10 automated or AI-drafted answers your team sent.",
      "Score each: correct / partially correct / wrong.",
      "Write the top fix (a knowledge-base gap, a prompt, a policy) and share it.",
    ],
  },
  // Prioritization
  {
    id: "pr-1",
    skill: "prioritization",
    kind: "learn",
    title: "Impact × urgency, not loudness",
    outcome: "You can explain why the loudest issue is not always the most important.",
    steps: [
      "List everything on your plate today.",
      "Score each item on impact (1–3) and urgency (1–3).",
      "Do the top item first and note what changed.",
    ],
  },
  {
    id: "pr-2",
    skill: "prioritization",
    kind: "practice",
    title: "Queue triage drill",
    outcome: "You triage a mixed queue in a consistent order.",
    steps: [
      "Take your next 10 open tickets.",
      "Order them by impact × urgency before working them.",
      "Afterwards, note any ticket you would now rank differently and why.",
    ],
  },
  {
    id: "pr-3",
    skill: "prioritization",
    kind: "apply",
    title: "Say no with a reason",
    outcome: "You defer low-impact work transparently.",
    steps: [
      "Identify one recurring low-impact task.",
      "Propose deferring, batching or automating it, with your reasoning.",
      "Record the outcome.",
    ],
  },
  // Stakeholder communication
  {
    id: "sc-1",
    skill: "stakeholder_communication",
    kind: "learn",
    title: "Bottom line up front",
    outcome: "Your internal updates start with the decision or ask.",
    steps: [
      "Rewrite your last internal escalation so the first sentence is the ask.",
      "Add the evidence in 2–3 bullets.",
      "End with the deadline and the owner.",
    ],
  },
  {
    id: "sc-2",
    skill: "stakeholder_communication",
    kind: "practice",
    title: "Map the decision-makers",
    outcome: "You know who decides, who influences and who uses.",
    steps: [
      "Pick one customer account you know.",
      "List the decision-maker, the day-to-day user and the internal owner.",
      "Write what each one cares about most.",
    ],
  },
  {
    id: "sc-3",
    skill: "stakeholder_communication",
    kind: "apply",
    title: "Run a 15-minute review",
    outcome: "You lead a short meeting that ends with agreed next steps.",
    steps: [
      "Schedule a 15-minute review with a teammate, lead or customer contact.",
      "Share an agenda: goal, evidence, decision needed.",
      "Send a 3-line recap with owners and dates afterwards.",
    ],
  },
];

export const MODULE_BY_ID: Record<string, ModuleDef> = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export function modulesForSkill(skill: SkillId): ModuleDef[] {
  return MODULES.filter((m) => m.skill === skill);
}
