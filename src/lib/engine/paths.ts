import { PATHS, PATH_BY_ID } from "@/lib/data/paths";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { clamp, round } from "@/lib/utils";
import type { AssessmentInput, Concern, PathId, RoleDef, SkillId, TimeBand } from "@/types";
import type { SkillProfile } from "./profile";

/**
 * Path engine: compares the user's effective skill levels with each path's
 * target role profile.
 *
 *   weightedSkillOverlap =
 *     Σ min(current, required) · importance  /  Σ required · importance     (0–1)
 *   gap = max(0, required − current)
 *
 * Path fit (0–1) is a transparent weighted sum. It is a planning aid, NOT a
 * validated suitability score or a probability of getting hired:
 *   0.50 · skill overlap
 *   0.20 · goal alignment     (what the user said they want)
 *   0.15 · concern alignment  (what the user is worried about)
 *   0.15 · time feasibility   (estimated weeks at their weekly budget)
 *   − 0.05 if the user wants to keep their income level and the path is
 *     Reinvent (bigger switches can mean entering at a more junior level;
 *     a planning assumption, not a data point).
 */

export const FIT_WEIGHTS = { overlap: 0.5, goal: 0.2, concern: 0.15, feasibility: 0.15 } as const;
export const INCOME_PENALTY = 0.05;

/** Midpoint hours per week for each time band. */
export const WEEKLY_HOURS: Record<TimeBand, number> = { "1to2": 1.5, "3to5": 4, "6to8": 7, "9plus": 10 };

/** How well each path speaks to each primary concern (editorial mapping). */
export const CONCERN_ALIGNMENT: Record<Concern, Record<PathId, number>> = {
  ai_changing_tasks: { adapt: 1, pivot: 0.7, reinvent: 0.4 },
  skills_outdated: { adapt: 0.9, pivot: 0.8, reinvent: 0.5 },
  adjacent_move: { adapt: 0.2, pivot: 1, reinvent: 0.5 },
  new_field: { adapt: 0.1, pivot: 0.5, reinvent: 1 },
};

export interface SkillGap {
  skill: SkillId;
  required: number;
  current: number;
  gap: number;
  importance: 1 | 2 | 3;
  weightedGap: number;
}

export interface FitFactor {
  id: "overlap" | "goal" | "concern" | "feasibility" | "income";
  label: string;
  value: number;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface PathEvaluation {
  pathId: PathId;
  roleId: string;
  roleTitle: string;
  overlap: number;
  gaps: SkillGap[];
  transferable: SkillId[];
  skillHours: number;
  extraPrepHours: number;
  totalHours: number;
  weeksLow: number;
  weeksHigh: number;
  effort: "Low" | "Moderate" | "High";
  fit: number;
  factors: FitFactor[];
  steppingStone?: { roleId: string; roleTitle: string; overlap: number };
}

export function weightedOverlap(role: RoleDef, profile: SkillProfile): number {
  let num = 0;
  let den = 0;
  for (const [skill, req] of Object.entries(role.requirements) as [SkillId, { level: number; importance: number }][]) {
    const current = profile[skill]?.effective ?? 0;
    num += Math.min(current, req.level) * req.importance;
    den += req.level * req.importance;
  }
  return den === 0 ? 0 : round(num / den, 3);
}

export function skillGaps(role: RoleDef, profile: SkillProfile): SkillGap[] {
  return (Object.entries(role.requirements) as [SkillId, { level: number; importance: 1 | 2 | 3 }][])
    .map(([skill, req]) => {
      const current = profile[skill]?.effective ?? 0;
      const gap = round(Math.max(0, req.level - current), 1);
      return { skill, required: req.level, current, gap, importance: req.importance, weightedGap: round(gap * req.importance, 2) };
    })
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.weightedGap - a.weightedGap || b.importance - a.importance);
}

function goalAlignment(goal: AssessmentInput["goal"], pathId: PathId) {
  if (goal === "help_me_choose") return 0.5;
  return goal === pathId ? 1 : 0;
}

export function evaluatePath(input: AssessmentInput, profile: SkillProfile, pathId: PathId): PathEvaluation {
  const path = PATH_BY_ID[pathId];
  const role = ROLE_BY_ID[path.targetRoleId];
  const overlap = weightedOverlap(role, profile);
  const gaps = skillGaps(role, profile);

  const transferable = (Object.entries(role.requirements) as [SkillId, { level: number; importance: number }][])
    .filter(([skill, req]) => req.importance >= 2 && (profile[skill]?.effective ?? 0) >= Math.min(req.level, 2))
    .map(([skill]) => skill);

  const skillHours = round(
    gaps.reduce((sum, g) => sum + g.gap * SKILL_BY_ID[g.skill].hoursPerLevel, 0),
    0,
  );
  const totalHours = skillHours + path.extraPrepHours;
  const weekly = WEEKLY_HOURS[input.weeklyTime];
  const weeks = totalHours / weekly;
  // Ranges, not point estimates: people's pace varies.
  const weeksLow = Math.max(1, Math.round(weeks * 0.8));
  const weeksHigh = Math.max(weeksLow + 1, Math.round(weeks * 1.3));
  const effort: PathEvaluation["effort"] = totalHours <= 30 ? "Low" : totalHours <= 80 ? "Moderate" : "High";

  // Feasibility: 1 if achievable in ~4 weeks, falling to 0 at ~44 weeks.
  const feasibility = round(clamp(1 - (weeks - 4) / 40), 3);
  const goal = goalAlignment(input.goal, pathId);
  const concern = CONCERN_ALIGNMENT[input.concern][pathId];
  const income = input.incomePreference === "keep_level" && pathId === "reinvent" ? -INCOME_PENALTY : 0;

  const factors: FitFactor[] = [
    {
      id: "overlap",
      label: "Skill overlap",
      value: overlap,
      weight: FIT_WEIGHTS.overlap,
      contribution: overlap * FIT_WEIGHTS.overlap,
      explanation: `Your current skills cover ${Math.round(overlap * 100)}% of the ${role.title} profile, weighted by importance.`,
    },
    {
      id: "goal",
      label: "Your stated goal",
      value: goal,
      weight: FIT_WEIGHTS.goal,
      contribution: goal * FIT_WEIGHTS.goal,
      explanation:
        input.goal === "help_me_choose"
          ? "You asked us to help choose, so every path gets the same neutral credit."
          : goal === 1
            ? "This is the direction you said you want."
            : "You said you prefer a different direction.",
    },
    {
      id: "concern",
      label: "Fits your main concern",
      value: concern,
      weight: FIT_WEIGHTS.concern,
      contribution: concern * FIT_WEIGHTS.concern,
      explanation: "How directly this path addresses the concern you selected (editorial mapping).",
    },
    {
      id: "feasibility",
      label: "Fits your weekly time",
      value: feasibility,
      weight: FIT_WEIGHTS.feasibility,
      contribution: feasibility * FIT_WEIGHTS.feasibility,
      explanation: `About ${totalHours} hours of focused practice at ~${weekly} h/week.`,
    },
  ];
  if (income !== 0) {
    factors.push({
      id: "income",
      label: "Income preference",
      value: 1,
      weight: INCOME_PENALTY,
      contribution: income,
      explanation: "You want to keep your income level; bigger switches can mean a more junior start (planning assumption).",
    });
  }
  const fit = round(clamp(factors.reduce((s, f) => s + f.contribution, 0)), 3);

  let steppingStone: PathEvaluation["steppingStone"];
  if (path.steppingStoneRoleId && overlap < 0.55) {
    const stone = ROLE_BY_ID[path.steppingStoneRoleId];
    steppingStone = { roleId: stone.id, roleTitle: stone.title, overlap: weightedOverlap(stone, profile) };
  }

  return {
    pathId,
    roleId: role.id,
    roleTitle: role.title,
    overlap,
    gaps,
    transferable,
    skillHours,
    extraPrepHours: path.extraPrepHours,
    totalHours,
    weeksLow,
    weeksHigh,
    effort,
    fit,
    factors,
    steppingStone,
  };
}

export function evaluateAllPaths(input: AssessmentInput, profile: SkillProfile) {
  const evaluations = PATHS.map((p) => evaluatePath(input, profile, p.id));
  const recommended = [...evaluations].sort((a, b) => b.fit - a.fit)[0].pathId;
  return { evaluations, recommended };
}
