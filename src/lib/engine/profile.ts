import { SKILL_IDS } from "@/lib/data/skills";
import { TASK_BY_ID } from "@/lib/data/tasks";
import { round } from "@/lib/utils";
import type { AssessmentInput, ChallengeAttempt, SkillId, TaskCategory } from "@/types";
import { mapCustomTask, type CustomTaskMapping } from "./customTasks";

/**
 * Skill profile = three separate kinds of evidence, never blended silently:
 *   self        — what the user told us (0–4, unverified)
 *   inferred    — implied by the tasks they do every week (0–3)
 *   demonstrated — measured by completed exercises (0–4), if any
 *
 * effective level (used for matching) =
 *   with demonstrated: 0.5·demonstrated + 0.3·self + 0.2·inferred
 *   otherwise:         0.6·self + 0.4·inferred
 * Self-report gets the larger share because the user knows their work best,
 * while task inference corrects for under- or over-claiming. Measured evidence,
 * when it exists, outweighs both.
 */
export interface SkillEstimate {
  skill: SkillId;
  self: number;
  inferred: number;
  inferredFrom: string[];
  demonstrated: number | null;
  effective: number;
}

export type SkillProfile = Record<SkillId, SkillEstimate>;

const SENIOR_BANDS = new Set(["5to10", "10plus"]);

export function mapAllCustomTasks(input: AssessmentInput): CustomTaskMapping[] {
  return input.customTasks.map(mapCustomTask);
}

export function inferSkillsFromTasks(input: AssessmentInput) {
  const inferred = Object.fromEntries(SKILL_IDS.map((id) => [id, { level: 0, from: [] as string[] }])) as Record<
    SkillId,
    { level: number; from: string[] }
  >;

  const apply = (label: string, skills: Partial<Record<SkillId, 1 | 2>>) => {
    for (const [skill, weight] of Object.entries(skills) as [SkillId, 1 | 2][]) {
      inferred[skill].level = Math.max(inferred[skill].level, weight);
      inferred[skill].from.push(label);
    }
  };

  for (const id of input.taskIds) {
    const task = TASK_BY_ID[id];
    if (task) apply(task.label, task.skills);
  }
  for (const mapping of mapAllCustomTasks(input)) apply(`"${mapping.text}"`, mapping.skills);

  // Doing a task for 5+ years implies more depth than doing it for a few months.
  if (SENIOR_BANDS.has(input.experience)) {
    for (const id of SKILL_IDS) {
      if (inferred[id].level >= 1) inferred[id].level = Math.min(3, inferred[id].level + 1);
    }
  }
  return inferred;
}

/** Latest measured evidence per skill from exercise attempts (0–4 scale). */
export function demonstratedLevels(attempts: ChallengeAttempt[]): Partial<Record<SkillId, number>> {
  const sorted = [...attempts].sort((a, b) => a.at - b.at);
  const levels: Partial<Record<SkillId, number>> = {};
  for (const attempt of sorted) {
    for (const [skill, share] of Object.entries(attempt.skillEvidence) as [SkillId, number][]) {
      levels[skill] = round(share * 4, 1);
    }
  }
  return levels;
}

export function computeSkillProfile(input: AssessmentInput, attempts: ChallengeAttempt[] = []): SkillProfile {
  const inferred = inferSkillsFromTasks(input);
  const demonstrated = demonstratedLevels(attempts);
  const profile = {} as SkillProfile;
  for (const id of SKILL_IDS) {
    const self = input.selfSkills[id] ?? 0;
    const inf = inferred[id].level;
    const demo = demonstrated[id] ?? null;
    const effective = demo !== null ? 0.5 * demo + 0.3 * self + 0.2 * inf : 0.6 * self + 0.4 * inf;
    profile[id] = {
      skill: id,
      self,
      inferred: inf,
      inferredFrom: inferred[id].from,
      demonstrated: demo,
      effective: round(effective, 1),
    };
  }
  return profile;
}

/* ---------- Task transformation map ---------- */

export interface TaskMapEntry {
  label: string;
  source: "curated" | "custom";
  category: TaskCategory | null;
  changeSignal: string;
}

export function buildTaskMap(input: AssessmentInput) {
  const entries: TaskMapEntry[] = [];
  for (const id of input.taskIds) {
    const t = TASK_BY_ID[id];
    if (t) entries.push({ label: t.label, source: "curated", category: t.category, changeSignal: t.changeSignal });
  }
  for (const m of mapAllCustomTasks(input)) {
    entries.push({
      label: m.text,
      source: "custom",
      category: m.category,
      changeSignal: m.category
        ? `Classified from keywords: ${m.matchedKeywords.slice(0, 4).join(", ")}. General preliminary guidance.`
        : "No recognized keywords, so we didn't classify it rather than guess.",
    });
  }
  const classified = entries.filter((e) => e.category);
  const share = (cat: TaskCategory) =>
    classified.length === 0 ? 0 : classified.filter((e) => e.category === cat).length / classified.length;
  return {
    entries,
    shares: {
      automation_exposed: share("automation_exposed"),
      ai_augmented: share("ai_augmented"),
      human_led: share("human_led"),
    } as Record<TaskCategory, number>,
  };
}
