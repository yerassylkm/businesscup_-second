"use client";

import { computeSkillProfile } from "@/lib/engine/profile";
import { evaluatePath } from "@/lib/engine/paths";
import { generatePlan, type PlanItem } from "@/lib/engine/plan";
import { DAY_MS } from "@/lib/utils";
import type { AssessmentInput, ChallengeAttempt, PathId } from "@/types";
import type { AppState } from "./schema";
import { getState, track, updateState } from "./store";

/** "Now" including the labeled demo time-travel offset. */
export function effectiveNow(state: AppState, real = Date.now()) {
  return real + state.demoDayOffset * DAY_MS;
}

/** Which plan week the user is in (1-based), from when the plan started. */
export function currentPlanWeek(state: AppState, real = Date.now()) {
  if (!state.plan) return 0;
  return Math.floor((effectiveNow(state, real) - state.plan.generatedAt) / (7 * DAY_MS)) + 1;
}

export function nextWeekUnlockAt(state: AppState, real = Date.now()) {
  if (!state.plan) return null;
  const week = currentPlanWeek(state, real);
  return state.plan.generatedAt + week * 7 * DAY_MS - state.demoDayOffset * DAY_MS;
}

function buildPlan(s: AppState, assessment: AssessmentInput, pathId: PathId, generatedAt: number) {
  const profile = computeSkillProfile(assessment, s.attempts);
  const evaluation = evaluatePath(assessment, profile, pathId);
  return { pathId, generatedAt, items: generatePlan(pathId, evaluation, assessment.weeklyTime) };
}

export function saveAssessment(input: AssessmentInput) {
  updateState((s) => {
    const next: AppState = { ...s, assessment: input, assessedAt: Date.now() };
    // A retaken assessment regenerates the plan for the selected path.
    if (s.selectedPathId) next.plan = buildPlan(next, input, s.selectedPathId, effectiveNow(s));
    return next;
  });
  track("assessment_completed", { sample: Boolean(input.isSample), goal: input.goal, tasks: input.taskIds.length });
}

export function selectPath(pathId: PathId) {
  const s = getState();
  if (!s.assessment) return;
  if (s.selectedPathId === pathId && s.plan?.pathId === pathId) return;
  updateState((st) => ({
    ...st,
    selectedPathId: pathId,
    plan: buildPlan(st, st.assessment!, pathId, effectiveNow(st)),
  }));
  track("path_selected", { path: pathId });
}

export function toggleItemComplete(itemId: string, note?: string) {
  updateState((s) => {
    const completed = { ...s.completedItems };
    if (completed[itemId] && note === undefined) delete completed[itemId];
    else completed[itemId] = { at: effectiveNow(s), note: note?.trim() || undefined };
    return { ...s, completedItems: completed };
  });
  if (getState().completedItems[itemId]) track("plan_item_completed", { item: itemId });
}

export function recordAttempt(attempt: Omit<ChallengeAttempt, "id" | "at">) {
  const s = getState();
  const at = effectiveNow(s);
  const full: ChallengeAttempt = { ...attempt, id: `${attempt.challengeId}-${attempt.stage}-${at}`, at };
  updateState((st) => {
    // Mark the matching plan item done when a challenge is completed.
    const completed = { ...st.completedItems };
    const item = st.plan?.items.find(
      (i) =>
        (i.kind === "challenge" || i.kind === "sprint") &&
        i.href === `/challenge/${attempt.challengeId}` &&
        (attempt.stage !== "baseline" || attempt.challengeId !== "cs-portfolio"),
    );
    if (item && !completed[item.id]) completed[item.id] = { at };
    return { ...st, attempts: [...st.attempts, full], completedItems: completed };
  });
  const event =
    attempt.stage === "baseline" ? "baseline_completed" : attempt.stage === "transfer" ? "transfer_completed" : "exercise_completed";
  track(event, { challenge: attempt.challengeId, score: attempt.total });
  return full;
}

export function completeLesson(lessonId: string) {
  updateState((s) => ({ ...s, lessonsCompleted: { ...s.lessonsCompleted, [lessonId]: effectiveNow(s) } }));
  track("lesson_completed", { lesson: lessonId });
}

export function advanceDemoWeek() {
  updateState((s) => ({ ...s, demoDayOffset: Math.min(365, s.demoDayOffset + 7) }));
  track("demo_week_advanced");
}

export function resetDemoTime() {
  updateState((s) => ({ ...s, demoDayOffset: 0 }));
}

export function setDemoPreview(on: boolean) {
  updateState((s) => ({ ...s, demoPreview: on }));
  if (on) track("demo_plus_preview");
}

export function hasAccess(state: AppState, access: "free" | "blueprint" | "plus") {
  return access === "free" || state.demoPreview;
}

/** Where a plan item lives: its challenge page, or its row on the roadmap. */
export function planItemHref(item: PlanItem, pathId: string) {
  return item.href ?? `/path/${pathId}#${item.id}`;
}

/**
 * Next plan step the user can actually do now: in an open week, accessible on
 * their tier, not yet completed. Null if everything open is done or locked.
 */
export function nextPlanItem(state: AppState, real = Date.now()): PlanItem | null {
  if (!state.plan) return null;
  const week = currentPlanWeek(state, real);
  return (
    (state.plan.items as PlanItem[]).find(
      (i) => i.week <= week && hasAccess(state, i.access) && !state.completedItems[i.id],
    ) ?? null
  );
}
