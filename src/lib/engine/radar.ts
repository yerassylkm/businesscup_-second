import { FREE_RADAR_SIGNALS, RADAR_BY_PATH, RADAR_SIGNALS, type RadarSignal } from "@/lib/data/radar";
import type { PathId } from "@/types";
import type { PathEvaluation } from "./paths";

export interface RadarItem extends RadarSignal {
  /** CTA with the user's path filled in. */
  ctaHref: string;
  /** How this signal's skill relates to the user's own gaps for the path. */
  planLink:
    | { kind: "gap"; current: number; required: number; gap: number }
    | { kind: "covered" }
    | { kind: "not_required" };
  /** Free tier sees the first signal only; the rest need Plus (or the judge demo preview). */
  access: "free" | "plus";
}

/**
 * Builds the Career Radar for a path: curated signals in priority order, each
 * linked to the user's computed gap for that skill (from the same engine as
 * the career map), with free/Plus access tags.
 */
export function buildRadar(pathId: PathId, evaluation: PathEvaluation, requiredSkills: string[]): RadarItem[] {
  return RADAR_BY_PATH[pathId].map((id, index) => {
    const signal = RADAR_SIGNALS[id];
    const gap = evaluation.gaps.find((g) => g.skill === signal.skill);
    const planLink: RadarItem["planLink"] = gap
      ? { kind: "gap", current: gap.current, required: gap.required, gap: gap.gap }
      : requiredSkills.includes(signal.skill)
        ? { kind: "covered" }
        : { kind: "not_required" };
    return {
      ...signal,
      ctaHref: signal.cta.href.replace("{path}", pathId),
      planLink,
      access: index < FREE_RADAR_SIGNALS ? "free" : "plus",
    };
  });
}
