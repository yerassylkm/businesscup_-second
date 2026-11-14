"use client";

import { useMemo } from "react";
import { buildTaskMap, computeSkillProfile } from "@/lib/engine/profile";
import { evaluateAllPaths } from "@/lib/engine/paths";
import type { AppState } from "./schema";

/**
 * Results are always recomputed from the saved raw inputs (assessment +
 * attempts). Nothing on the results page is a stored, pre-written report.
 */
export function useCareerResults(state: AppState) {
  return useMemo(() => {
    if (!state.assessment) return null;
    const profile = computeSkillProfile(state.assessment, state.attempts);
    const { evaluations, recommended } = evaluateAllPaths(state.assessment, profile);
    const taskMap = buildTaskMap(state.assessment);
    return { assessment: state.assessment, profile, evaluations, recommended, taskMap };
  }, [state.assessment, state.attempts]);
}

export type CareerResults = NonNullable<ReturnType<typeof useCareerResults>>;
