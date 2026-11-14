import { AI_DRAFT_REVIEW, OPS_VOLUME } from "@/lib/data/exercises";
import { clamp, round } from "@/lib/utils";
import type { DimensionScore, ScoreResult } from "@/types";

/* ---------- Adapt: AI draft review ---------- */

export interface DraftReviewAnswer {
  flagged: string[];
  decisionId: string;
  replacementId: string;
}

/**
 * Rubric (100):
 *   Error detection 50 — 50/3 per real error flagged, −12 per correct
 *                         sentence wrongly flagged (floored at 0)
 *   Correct rewrite 30 — the replacement must follow the refund policy
 *   Send decision   20 — fix-then-send is best; escalating everything is partial
 */
export function scoreDraftReview(answer: DraftReviewAnswer): ScoreResult {
  const errors: string[] = AI_DRAFT_REVIEW.sentences.filter((s) => s.isError).map((s) => s.id);
  const caught = answer.flagged.filter((id) => errors.includes(id));
  const falseFlags = answer.flagged.filter((id) => !errors.includes(id));
  const detection = round(clamp((caught.length * (50 / errors.length) - falseFlags.length * 12) / 50) * 50, 1);
  const missed = AI_DRAFT_REVIEW.sentences.filter((s) => s.isError && !answer.flagged.includes(s.id));

  const replacement = AI_DRAFT_REVIEW.replacementOptions.find((r) => r.id === answer.replacementId);
  const decision = AI_DRAFT_REVIEW.decisionOptions.find((d) => d.id === answer.decisionId);

  const dimensions: DimensionScore[] = [
    {
      id: "evidence",
      label: "Error detection",
      points: detection,
      max: 50,
      feedback:
        `You caught ${caught.length} of ${errors.length} policy errors` +
        (falseFlags.length ? ` and flagged ${falseFlags.length} correct sentence(s) by mistake.` : ".") +
        (missed.length ? ` Missed: ${missed.map((m) => `"${m.text}" (${m.why})`).join(" ")}` : ""),
    },
    {
      id: "action",
      label: "Correct rewrite",
      points: replacement?.points ?? 0,
      max: 30,
      feedback:
        (replacement?.points ?? 0) > 0
          ? "Your rewrite follows the policy: submitted for review, correct 5–7 business-day window."
          : "That rewrite still breaks the refund policy. Refunds are submitted for review and take 5–7 business days once confirmed.",
    },
    {
      id: "prioritization",
      label: "Send decision",
      points: decision?.points ?? 0,
      max: 20,
      feedback:
        decision?.id === "edit"
          ? "Right call: fix what's wrong and keep the customer moving."
          : decision?.id === "escalate"
            ? "Escalating is safe but slow. Most of this reply is fixable by you."
            : "Sending unchecked AI output would have promised things the company can't deliver.",
    },
  ];
  const total = round(dimensions.reduce((s, d) => s + d.points, 0), 0);
  return {
    total,
    max: 100,
    dimensions,
    skillEvidence: {
      ai_output_verification: round((detection / 50 + (replacement?.points ?? 0) / 30) / 2, 2),
      customer_communication: round((replacement?.points ?? 0) / 30, 2),
    },
  };
}

/* ---------- Reinvent: ops volume analysis ---------- */

export interface OpsAnswer {
  categoryId: string;
  hoursEstimate: number;
  metricId: string;
  caveatId: string;
}

/** Weekly agent hours that full automation of the standard steps would free. */
export function automatableHours(c: { weeklyVolume: number; minutesPerTicket: number; standardShare: number }) {
  return round((c.weeklyVolume * c.minutesPerTicket * c.standardShare) / 60, 1);
}

export function rankOpsCategories() {
  return [...OPS_VOLUME.categories]
    .map((c) => ({ ...c, hours: automatableHours(c) }))
    .sort((a, b) => b.hours - a.hours);
}

/**
 * Rubric (100):
 *   Choice     40 — rank by automatable hours (1st 40, 2nd 25, 3rd 15)
 *   Estimate   25 — hours estimate for YOUR chosen category within ±10% (25)
 *                   or ±25% (12) of volume × minutes × standard share ÷ 60
 *   Metric     20 — measure the outcome you are changing
 *   Caveat     15 — question the data before acting on it
 */
export function scoreOps(answer: OpsAnswer): ScoreResult & { ranking: ReturnType<typeof rankOpsCategories> } {
  const ranking = rankOpsCategories();
  const idx = ranking.findIndex((c) => c.id === answer.categoryId);
  const chosen = ranking[idx];
  const choicePoints = [40, 25, 15][idx] ?? 0;
  const target = chosen ? chosen.hours : 0;
  const err = target > 0 ? Math.abs(answer.hoursEstimate - target) / target : 1;
  const estimatePoints = err <= 0.1 ? 25 : err <= 0.25 ? 12 : 0;
  const metric = OPS_VOLUME.metricOptions.find((m) => m.id === answer.metricId);
  const caveat = OPS_VOLUME.caveatOptions.find((c) => c.id === answer.caveatId);
  const top = ranking[0];

  const dimensions: DimensionScore[] = [
    {
      id: "prioritization",
      label: "Choice of process",
      points: choicePoints,
      max: 40,
      feedback:
        idx === 0
          ? `Correct: ${chosen.name} frees the most agent time (~${chosen.hours} h/week).`
          : `${chosen?.name ?? "That"} ranks #${idx + 1}. ${top.name} frees more time (~${top.hours} h/week): volume × minutes × standard share beats raw volume alone.`,
    },
    {
      id: "evidence",
      label: "Hours estimate",
      points: estimatePoints,
      max: 25,
      feedback: `For ${chosen?.name ?? "your choice"}: ${chosen?.weeklyVolume} × ${chosen?.minutesPerTicket} min × ${Math.round((chosen?.standardShare ?? 0) * 100)}% ÷ 60 ≈ ${target} h/week. You estimated ${answer.hoursEstimate}.`,
    },
    {
      id: "action",
      label: "Success metric",
      points: metric?.points ?? 0,
      max: 20,
      feedback:
        (metric?.points ?? 0) === 20
          ? "Good: measure the agent time you're trying to free, before and after."
          : "Pick the metric that measures the change you're making: agent hours on that category.",
    },
    {
      id: "risk",
      label: "Data skepticism",
      points: caveat?.points ?? 0,
      max: 15,
      feedback:
        (caveat?.points ?? 0) > 0
          ? "Good: the whole case rests on the 'standard steps' share, so verify it first."
          : "Before investing, check the weakest assumption: is the 'standard steps' share measured?",
    },
  ];
  return {
    total: round(dimensions.reduce((s, d) => s + d.points, 0), 0),
    max: 100,
    dimensions,
    ranking,
    skillEvidence: {
      prioritization: round(choicePoints / 40, 2),
      data_interpretation: round((choicePoints / 40 + estimatePoints / 25) / 2, 2),
      process_automation: round(((metric?.points ?? 0) / 20 + (caveat?.points ?? 0) / 15) / 2, 2),
    },
  };
}
