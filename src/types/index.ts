/**
 * Shared domain types for shifto.
 *
 * Skill levels use a 0–4 scale everywhere:
 *   0 = not yet, 1 = basic, 2 = working, 3 = strong, 4 = expert.
 */

export type SkillId =
  | "customer_communication"
  | "conflict_resolution"
  | "customer_health_analysis"
  | "crm_hygiene"
  | "churn_prevention"
  | "data_interpretation"
  | "process_automation"
  | "ai_output_verification"
  | "prioritization"
  | "stakeholder_communication";

export type PathId = "adapt" | "pivot" | "reinvent";

export type TaskCategory = "automation_exposed" | "ai_augmented" | "human_led";

export type ExperienceBand = "lt2" | "2to5" | "5to10" | "10plus";
export type Concern = "ai_changing_tasks" | "skills_outdated" | "adjacent_move" | "new_field";
export type Goal = PathId | "help_me_choose";
export type TimeBand = "1to2" | "3to5" | "6to8" | "9plus";
export type BudgetBand = "none" | "under25" | "under50" | "over50" | "unsure";
export type IncomePreference = "keep_level" | "open_to_dip" | "prefer_not";

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  /**
   * Planning estimate: focused practice hours to move one level on our 0–4
   * scale. Editorial estimate used only to size roadmaps — not validated.
   */
  hoursPerLevel: number;
}

export interface TaskDef {
  id: string;
  label: string;
  category: TaskCategory;
  /** Plain-language reason for the category (editorial, not a probability). */
  changeSignal: string;
  /** Skills the task exercises: 2 = primary, 1 = secondary. */
  skills: Partial<Record<SkillId, 1 | 2>>;
}

export interface SkillRequirement {
  /** Required level on the 0–4 scale. */
  level: number;
  /** 1 = nice to have, 2 = important, 3 = core. */
  importance: 1 | 2 | 3;
}

export interface RoleDef {
  id: string;
  title: string;
  summary: string;
  requirements: Partial<Record<SkillId, SkillRequirement>>;
}

export interface PathDef {
  id: PathId;
  name: string;
  tagline: string;
  description: string;
  targetRoleId: string;
  /** Optional closer role suggested when overlap with the target is low. */
  steppingStoneRoleId?: string;
  /** Extra preparation hours on top of skill gaps (portfolio, credentials). */
  extraPrepHours: number;
  extraPrepLabel?: string;
  entryPoints: string[];
  uncertainty: string;
  warning?: string;
  firstChallengeId: string;
}

export interface AssessmentInput {
  roleChoice: "customer_support_specialist" | "custom";
  customRoleTitle?: string;
  experience: ExperienceBand;
  taskIds: string[];
  customTasks: string[];
  concern: Concern;
  selfSkills: Record<SkillId, number>;
  goal: Goal;
  weeklyTime: TimeBand;
  budget?: BudgetBand;
  incomePreference?: IncomePreference;
  /** True when the inputs were loaded from the sample preset. */
  isSample?: boolean;
}

/* ---------- Challenge content ---------- */

export type SentimentLevel = "positive" | "neutral" | "mixed" | "negative";

export interface Account {
  id: string;
  name: string;
  segment: string;
  arr: number;
  renewalInDays: number;
  /** Change in weekly active usage over the last 30 days, in percent. */
  usageChange30d: number;
  seatsUsed: number;
  seatsLicensed: number;
  openTickets: number;
  sentiment: SentimentLevel;
  /** Most recent NPS response, 0–10, or null if none. */
  lastNps: number | null;
  championLeft: boolean;
  expansionSignal: boolean;
  note: string;
}

export type RiskType = "adoption" | "relationship" | "service" | "expansion" | "routine_renewal";
export type SignalId =
  | "usage_drop"
  | "renewal_soon"
  | "champion_left"
  | "negative_sentiment"
  | "low_seat_use"
  | "detractor"
  | "ticket_volume"
  | "high_arr"
  | "expansion_interest";

export interface ActionOption {
  id: string;
  label: string;
  /** How well this action addresses each risk type (0–1). */
  fit: Record<RiskType, number>;
}

export interface PortfolioScenario {
  id: string;
  title: string;
  company: string;
  context: string;
  accounts: Account[];
}

export interface PortfolioAnswer {
  accountId: string;
  signals: SignalId[];
  risk: RiskType;
  actionId: string;
  message: string;
}

export interface DimensionScore {
  id: "prioritization" | "evidence" | "risk" | "action";
  label: string;
  points: number;
  max: number;
  feedback: string;
}

export interface ScoreResult {
  total: number;
  max: number;
  dimensions: DimensionScore[];
  /** Skill evidence produced by this attempt, as a 0–1 share per skill. */
  skillEvidence: Partial<Record<SkillId, number>>;
}

export type ChallengeStage = "baseline" | "transfer" | "single";

export interface ChallengeAttempt {
  id: string;
  challengeId: string;
  scenarioId: string;
  stage: ChallengeStage;
  pathId: PathId;
  at: number;
  total: number;
  max: number;
  dimensions: { id: string; label: string; points: number; max: number }[];
  skillEvidence: Partial<Record<SkillId, number>>;
  /** Raw answer, kept so the user can review what they submitted. */
  answer: unknown;
}
