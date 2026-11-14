import { PATH_BY_ID } from "@/lib/data/paths";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { modulesForSkill, type ModuleDef } from "@/lib/data/modules";
import type { PathId, SkillId, TimeBand } from "@/types";
import type { PathEvaluation } from "./paths";

/**
 * 14-day plan generator.
 *
 * Inputs that change the plan:
 *   - weekly time budget → number of sessions and minutes per session
 *   - the selected path → first challenge, sprint, and target role
 *   - the user's weighted skill gaps for that path → which modules, how many
 *
 * Allocation: sessions left after fixed items (challenge, weekly reviews,
 * sprint) are split across gap skills in proportion to weightedGap
 * (largest-remainder rounding, at least one session for each of the top
 * three gaps when there is room). Modules for a skill are taken in order
 * learn → practice → apply and interleaved across skills.
 */

export type PlanAccess = "free" | "blueprint" | "plus";

export interface PlanItem {
  id: string;
  day: number;
  week: 1 | 2;
  kind: "challenge" | "module" | "review" | "sprint";
  title: string;
  outcome: string;
  minutes: number;
  skill?: SkillId;
  moduleId?: string;
  href?: string;
  access: PlanAccess;
}

export const SESSION_SHAPE: Record<TimeBand, { perWeek: number; minutes: number; days: number[] }> = {
  "1to2": { perWeek: 3, minutes: 30, days: [1, 3, 5] },
  "3to5": { perWeek: 4, minutes: 55, days: [1, 2, 4, 6] },
  "6to8": { perWeek: 5, minutes: 80, days: [1, 2, 3, 5, 6] },
  "9plus": { perWeek: 6, minutes: 95, days: [1, 2, 3, 4, 5, 6] },
};

const CHALLENGE_TITLES: Record<PathId, { title: string; outcome: string; minutes: number }> = {
  pivot: {
    title: "Flagship challenge: customer portfolio (before → lesson → after)",
    outcome: "Measured before/after evidence of customer-success judgment.",
    minutes: 25,
  },
  adapt: {
    title: "Skill check: review an AI-drafted reply",
    outcome: "A measured baseline for AI output verification.",
    minutes: 10,
  },
  reinvent: {
    title: "Skill check: find the process worth automating",
    outcome: "A measured baseline for operational data analysis.",
    minutes: 12,
  },
};

export function allocateSessions(gaps: { skill: SkillId; weightedGap: number }[], sessions: number) {
  const pool = gaps.filter((g) => g.weightedGap > 0);
  if (pool.length === 0 || sessions <= 0) return [] as { skill: SkillId; count: number }[];
  const total = pool.reduce((s, g) => s + g.weightedGap, 0);
  const raw = pool.map((g) => ({ skill: g.skill, exact: (g.weightedGap / total) * sessions }));
  const result = raw.map((r) => ({ skill: r.skill, count: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  // Guarantee coverage of the top three gaps when there is room.
  const minCovered = Math.min(3, result.length, sessions);
  for (let i = 0; i < minCovered; i++) if (result[i].count === 0) result[i].count = 1;
  let assigned = result.reduce((s, r) => s + r.count, 0);
  // Trim from the smallest-weight skills if the minimums overshot.
  for (let i = result.length - 1; assigned > sessions && i >= 0; i--) {
    while (result[i].count > (i < minCovered ? 1 : 0) && assigned > sessions) {
      result[i].count--;
      assigned--;
    }
  }
  // Distribute the remaining sessions by largest remainder.
  const order = [...result].sort((a, b) => b.rem - a.rem);
  for (let i = 0; assigned < sessions; i = (i + 1) % order.length) {
    order[i].count++;
    assigned++;
  }
  return result.filter((r) => r.count > 0).map(({ skill, count }) => ({ skill, count }));
}

/** Interleave modules across skills: s1#1, s2#1, s3#1, s1#2, ... */
function pickModules(allocation: { skill: SkillId; count: number }[]): ModuleDef[] {
  const queues = allocation.map((a) => {
    const mods = modulesForSkill(a.skill);
    return Array.from({ length: a.count }, (_, i) => mods[i % mods.length]);
  });
  const out: ModuleDef[] = [];
  const max = Math.max(0, ...queues.map((q) => q.length));
  for (let i = 0; i < max; i++) for (const q of queues) if (q[i]) out.push(q[i]);
  return out;
}

export function generatePlan(pathId: PathId, evaluation: PathEvaluation, weeklyTime: TimeBand): PlanItem[] {
  const shape = SESSION_SHAPE[weeklyTime];
  const path = PATH_BY_ID[pathId];
  const items: PlanItem[] = [];

  // Fixed items.
  const challenge = CHALLENGE_TITLES[pathId];
  const fixedSessions = pathId === "pivot" ? 2 : 1; // pivot also gets the week-2 sprint
  const totalSessions = shape.perWeek * 2;
  const moduleSessions = Math.max(0, totalSessions - fixedSessions);

  // Gaps drive module choice; if there are none, stretch on the role's core skills.
  let gapList = evaluation.gaps.map((g) => ({ skill: g.skill, weightedGap: g.weightedGap }));
  if (gapList.length === 0) {
    const role = ROLE_BY_ID[evaluation.roleId];
    gapList = (Object.entries(role.requirements) as [SkillId, { importance: number }][])
      .sort((a, b) => b[1].importance - a[1].importance)
      .slice(0, 3)
      .map(([skill, r]) => ({ skill, weightedGap: r.importance }));
  }
  const modules = pickModules(allocateSessions(gapList, moduleSessions));

  // Lay sessions onto days.
  const slots: { day: number; week: 1 | 2 }[] = [];
  for (const week of [1, 2] as const) for (const d of shape.days) slots.push({ day: d + (week - 1) * 7, week });

  let moduleIdx = 0;
  const firstModuleOfWeek = new Set<number>();
  slots.forEach((slot, i) => {
    const isFirst = i === 0;
    const isLast = i === slots.length - 1;
    if (isFirst) {
      items.push({
        id: `${pathId}-d${slot.day}-challenge`,
        day: slot.day,
        week: slot.week,
        kind: "challenge",
        title: challenge.title,
        outcome: challenge.outcome,
        minutes: challenge.minutes,
        href: `/challenge/${path.firstChallengeId}`,
        access: "free",
      });
      return;
    }
    if (isLast && pathId === "pivot") {
      items.push({
        id: `${pathId}-d${slot.day}-sprint`,
        day: slot.day,
        week: slot.week,
        kind: "sprint",
        title: "Week 2 Skill Sprint: a new customer portfolio",
        outcome: "Prove the skill holds up on a third, harder portfolio.",
        minutes: 20,
        href: "/challenge/cs-sprint",
        access: "plus",
      });
      return;
    }
    const mod = modules[moduleIdx++];
    if (!mod) return;
    const free = !firstModuleOfWeek.has(slot.week);
    firstModuleOfWeek.add(slot.week);
    items.push({
      id: `${pathId}-d${slot.day}-${mod.id}`,
      day: slot.day,
      week: slot.week,
      kind: "module",
      title: mod.title,
      outcome: mod.outcome,
      minutes: shape.minutes,
      skill: mod.skill,
      moduleId: mod.id,
      access: free ? "free" : "blueprint",
    });
  });

  // Weekly reviews on day 7 and 14 (free: the return loop must work for everyone).
  for (const week of [1, 2] as const) {
    items.push({
      id: `${pathId}-d${week * 7}-review`,
      day: week * 7,
      week,
      kind: "review",
      title: week === 1 ? "Week 1 review: what changed, what's next" : "Week 2 review: re-rate your skills",
      outcome: "A short reflection saved to your progress log.",
      minutes: 10,
      access: "free",
    });
  }

  return items.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
}
