"use client";

import { ArrowRight, RefreshCcw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge, Button, ButtonLink, Card } from "@/components/ui";
import { PATH_BY_ID } from "@/lib/data/paths";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { profileUpdate } from "@/lib/engine/progress";
import { nextPlanItem, nextWeekUnlockAt, planItemHref, selectPath } from "@/lib/storage/actions";
import { useAppState } from "@/lib/storage/store";
import { cn, formatDate } from "@/lib/utils";
import type { ChallengeAttempt, PathId } from "@/types";

function Trend({ from, to }: { from: number | null; to: number }) {
  if (from === null) return null;
  const d = Math.round((to - from) * 10) / 10;
  const Icon = d > 0 ? TrendingUp : d < 0 ? TrendingDown : Minus;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", d > 0 ? "text-mint" : d < 0 ? "text-coral" : "text-muted")}>
      <Icon className="size-3.5" aria-hidden />
      {d > 0 ? "+" : ""}
      {d}
    </span>
  );
}

/**
 * Shows what one attempt changed: measured skill evidence before → after,
 * the path gaps that moved, and the next plan step. All values are recomputed
 * from stored attempts (see lib/engine/progress.ts).
 */
export function ProfileUpdateCard({ attempt, pathId }: { attempt: ChallengeAttempt; pathId: PathId }) {
  const state = useAppState();
  const update = profileUpdate(state.assessment, state.attempts, attempt.id, pathId);
  if (!update) return null;
  const planForPath = state.plan?.pathId === pathId;
  const next = planForPath ? nextPlanItem(state) : null;
  const unlockAt = planForPath ? nextWeekUnlockAt(state) : null;
  const path = PATH_BY_ID[pathId];

  return (
    <Card role="region" className="border-lavender/30" aria-labelledby={`pu-${attempt.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="lavender">
          <RefreshCcw className="size-3" aria-hidden /> Loop
        </Badge>
        <h3 id={`pu-${attempt.id}`} className="font-display text-lg font-bold">
          Your profile updated
        </h3>
      </div>
      <p className="mt-1 text-sm text-muted">
        This attempt is now measured evidence in your skill profile{update.roleTitle ? `, compared with ${update.roleTitle}` : ""}.
      </p>

      <ul className="mt-4 space-y-3">
        {update.skills.map((s) => (
          <li key={s.skill} className="rounded-xl bg-black/20 p-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold">{SKILL_BY_ID[s.skill].name}</span>
              <span className="flex items-center gap-2">
                <span className="text-muted">
                  {s.before.source === "measured"
                    ? `measured ${s.before.level!.toFixed(1)}`
                    : s.before.source === "self"
                      ? `self-rated ${s.before.level} (unverified)`
                      : "not measured"}
                  {" → "}
                  <span className="font-semibold text-ink">measured {s.after.toFixed(1)}</span>
                  <span className="text-faint"> / 4</span>
                </span>
                <Trend from={s.before.level} to={s.after} />
              </span>
            </div>
            {s.gapBefore !== null && s.gapAfter !== null && (
              <p className={cn("mt-1 text-xs", s.gapAfter < s.gapBefore ? "text-mint" : s.gapAfter > s.gapBefore ? "text-coral" : "text-faint")}>
                Gap for {update.roleTitle}: {s.gapBefore.toFixed(1)} → {s.gapAfter.toFixed(1)}
                {s.gapAfter < s.gapBefore ? " (shrank)" : s.gapAfter > s.gapBefore ? " (grew)" : " (unchanged)"}
              </p>
            )}
          </li>
        ))}
      </ul>
      {update.shrunkGaps.length > 0 && (
        <p className="mt-3 text-sm text-mint">
          Biggest gap closed: {SKILL_BY_ID[update.shrunkGaps[0].skill].name} ({update.shrunkGaps[0].gapBefore!.toFixed(1)} →{" "}
          {update.shrunkGaps[0].gapAfter!.toFixed(1)}).
        </p>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-faint">Next step in your plan</p>
        {!state.assessment ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Take the career check to connect this evidence to a personal plan.</p>
            <ButtonLink href="/assessment" size="sm">
              Take the career check
            </ButtonLink>
          </div>
        ) : !planForPath ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {state.plan ? `Your current plan is ${PATH_BY_ID[state.plan.pathId].name}.` : "You haven't picked a path yet."} Make {path.name} your path to
              turn this into a 14-day plan.
            </p>
            <Button size="sm" onClick={() => selectPath(pathId)}>
              Make {path.name} my path
            </Button>
          </div>
        ) : next ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="text-faint">Day {next.day} · </span>
              <span className="font-semibold">{next.title}</span> <span className="text-faint">({next.minutes} min)</span>
            </p>
            <ButtonLink href={planItemHref(next, pathId)} size="sm">
              Continue: day {next.day} <ArrowRight className="size-3.5" aria-hidden />
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Everything open in your plan is done{unlockAt ? `. The next week opens ${formatDate(unlockAt)}` : ""}.
            </p>
            <ButtonLink href="/dashboard" size="sm" variant="secondary">
              Go to my plan
            </ButtonLink>
          </div>
        )}
      </div>
    </Card>
  );
}
