import { SCENARIO_BASELINE, SCENARIO_TRANSFER } from "@/lib/data/scenarios";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { scorePortfolio, type PortfolioScoreResult } from "@/lib/engine/portfolio";
import { formatDate } from "@/lib/utils";
import type { ChallengeAttempt, PortfolioAnswer, SkillId } from "@/types";

export const CS_CHALLENGE_ID = "cs-portfolio";

export interface CareerProof {
  baseline: ChallengeAttempt;
  transfer: ChallengeAttempt;
  before: PortfolioScoreResult;
  after: PortfolioScoreResult;
  skills: { skill: SkillId; share: number }[];
  attempts: ChallengeAttempt[];
  shareText: string;
}

function latest(attempts: ChallengeAttempt[], stage: "baseline" | "transfer") {
  return attempts
    .filter((a) => a.challengeId === CS_CHALLENGE_ID && a.stage === stage)
    .sort((a, b) => b.at - a.at)[0];
}

/** Neutral, plain-text summary for sharing. No claims beyond the scores. */
export function careerProofShareText(before: number, beforeAt: number, after: number, afterAt: number, skills: SkillId[]) {
  return [
    "PIVOTREADY Career Proof: Customer Support → Customer Success practice challenge",
    `Before: ${before}/100 (${formatDate(beforeAt)}). After, on a new portfolio I hadn't seen: ${after}/100 (${formatDate(afterAt)}).`,
    `Skills practiced: ${skills.map((s) => SKILL_BY_ID[s].name).join(", ")}.`,
    "This was a training exercise, not a certificate or an employment qualification.",
  ].join("\n");
}

/**
 * Career Proof from stored attempts (latest baseline + latest transfer),
 * re-scored with the live engine. Null until both stages are done.
 */
export function buildCareerProof(allAttempts: ChallengeAttempt[]): CareerProof | null {
  const baseline = latest(allAttempts, "baseline");
  const transfer = latest(allAttempts, "transfer");
  if (!baseline || !transfer) return null;
  try {
    const before = scorePortfolio(SCENARIO_BASELINE, baseline.answer as PortfolioAnswer);
    const after = scorePortfolio(SCENARIO_TRANSFER, transfer.answer as PortfolioAnswer);
    const skills = (Object.entries(after.skillEvidence) as [SkillId, number][]).map(([skill, share]) => ({ skill, share }));
    return {
      baseline,
      transfer,
      before,
      after,
      skills,
      attempts: allAttempts.filter((a) => a.challengeId === CS_CHALLENGE_ID).sort((a, b) => a.at - b.at),
      shareText: careerProofShareText(before.total, baseline.at, after.total, transfer.at, skills.map((s) => s.skill)),
    };
  } catch {
    return null;
  }
}
