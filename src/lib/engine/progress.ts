import { PATH_BY_ID } from "@/lib/data/paths";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { evaluatePath, type PathEvaluation } from "./paths";
import { computeSkillProfile, demonstratedLevels } from "./profile";
import type { AssessmentInput, ChallengeAttempt, PathId, SkillId } from "@/types";

/**
 * "Your profile updated": what one attempt changed in the user's profile.
 * Everything is recomputed from stored attempts with the same engine as the
 * career map:
 *   before = profile from attempts made before this one
 *   after  = profile including this attempt
 * Changes can go either way; a weaker attempt shows a lower value honestly.
 */
export interface SkillChange {
  skill: SkillId;
  /** Evidence before the attempt: earlier measurement, else self-rating, else nothing. */
  before: { source: "measured" | "self" | "none"; level: number | null };
  /** Measured level from this attempt (0–4). */
  after: number;
  /** Gap to the path's target role, or null if the role doesn't require the skill / no assessment. */
  gapBefore: number | null;
  gapAfter: number | null;
}

export interface ProfileUpdate {
  pathId: PathId;
  roleTitle: string | null;
  skills: SkillChange[];
  /** Skills whose gap got smaller, largest change first. */
  shrunkGaps: SkillChange[];
}

function gapFor(ev: PathEvaluation | null, skill: SkillId, required: boolean) {
  if (!ev || !required) return null;
  return ev.gaps.find((g) => g.skill === skill)?.gap ?? 0;
}

export function profileUpdate(
  assessment: AssessmentInput | null,
  attempts: ChallengeAttempt[],
  attemptId: string,
  pathId: PathId,
): ProfileUpdate | null {
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;
  const prior = attempts.filter((a) => a.id !== attempt.id && a.at <= attempt.at);
  const withAttempt = [...prior, attempt];

  const demoBefore = demonstratedLevels(prior);
  const demoAfter = demonstratedLevels(withAttempt);

  let evBefore: PathEvaluation | null = null;
  let evAfter: PathEvaluation | null = null;
  if (assessment) {
    evBefore = evaluatePath(assessment, computeSkillProfile(assessment, prior), pathId);
    evAfter = evaluatePath(assessment, computeSkillProfile(assessment, withAttempt), pathId);
  }
  const role = ROLE_BY_ID[PATH_BY_ID[pathId].targetRoleId];
  const isRequired = (skill: SkillId) => Boolean(role.requirements[skill]);

  const skills: SkillChange[] = (Object.keys(attempt.skillEvidence) as SkillId[]).map((skill) => {
    const measuredBefore = demoBefore[skill];
    const before: SkillChange["before"] =
      measuredBefore !== undefined
        ? { source: "measured", level: measuredBefore }
        : assessment
          ? { source: "self", level: assessment.selfSkills[skill] }
          : { source: "none", level: null };
    const required = isRequired(skill);
    return {
      skill,
      before,
      after: demoAfter[skill] ?? 0,
      gapBefore: gapFor(evBefore, skill, required),
      gapAfter: gapFor(evAfter, skill, required),
    };
  });

  const shrunkGaps = skills
    .filter((s) => s.gapBefore !== null && s.gapAfter !== null && s.gapAfter < s.gapBefore)
    .sort((a, b) => b.gapBefore! - b.gapAfter! - (a.gapBefore! - a.gapAfter!));

  return { pathId, roleTitle: role.title, skills, shrunkGaps };
}
