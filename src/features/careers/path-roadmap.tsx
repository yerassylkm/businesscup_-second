"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock, FastForward, Lock, PlayCircle } from "lucide-react";
import { PATH_STYLE, PathGlyph } from "@/components/brand";
import { Badge, Button, ButtonLink, Card, Container, Notice, ProgressBar, SectionTitle } from "@/components/ui";
import { PaywallCard } from "@/features/billing/paywall";
import { MODULE_BY_ID } from "@/lib/data/modules";
import { PATH_BY_ID, PATHS } from "@/lib/data/paths";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { generatePlan, type PlanItem } from "@/lib/engine/plan";
import {
  advanceDemoWeek,
  currentPlanWeek,
  hasAccess,
  nextWeekUnlockAt,
  selectPath,
  toggleItemComplete,
} from "@/lib/storage/actions";
import { useCareerResults } from "@/lib/storage/derived";
import type { AppState } from "@/lib/storage/schema";
import { useAppState } from "@/lib/storage/store";
import { cn, DAY_MS, formatDate, pct } from "@/lib/utils";
import type { PathId, SkillId } from "@/types";
import { NoAssessment } from "./no-assessment";

export function PathRoadmap({ pathId }: { pathId: PathId }) {
  const state = useAppState();
  const results = useCareerResults(state);
  const isSelected = state.selectedPathId === pathId && state.plan?.pathId === pathId;

  const evaluation = results?.evaluations.find((e) => e.pathId === pathId);
  const items: PlanItem[] = useMemo(() => {
    if (isSelected && state.plan) return state.plan.items as PlanItem[];
    if (!results || !evaluation) return [];
    return generatePlan(pathId, evaluation, results.assessment.weeklyTime);
  }, [isSelected, state.plan, results, evaluation, pathId]);

  if (!results || !evaluation) return <NoAssessment title="Take the career check to build your plan" />;

  const path = PATH_BY_ID[pathId];
  const role = ROLE_BY_ID[path.targetRoleId];
  const week = isSelected ? currentPlanWeek(state) : 1;
  const unlockAt = isSelected ? nextWeekUnlockAt(state) : null;
  const doneCount = items.filter((i) => state.completedItems[i.id]).length;
  const minutes = items.reduce((s, i) => s + i.minutes, 0);

  return (
    <Container className="py-10 sm:py-14">
      {/* Path switcher */}
      <nav aria-label="Switch path" className="no-print mb-8 flex gap-2 overflow-x-auto pb-1">
        {PATHS.map((p) => (
          <Link
            key={p.id}
            href={`/path/${p.id}`}
            aria-current={p.id === pathId ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition-colors",
              p.id === pathId ? "border-lavender/60 bg-brand/20 text-ink" : "border-line text-muted hover:text-soft",
            )}
          >
            {p.name}
            {state.selectedPathId === p.id && <span className="size-1.5 rounded-full bg-mint" aria-label="(your path)" />}
            {results.recommended === p.id && <span className="text-[10px] font-bold uppercase text-lavender">rec.</span>}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-start gap-4">
            <PathGlyph pathId={pathId} className="size-14" />
            <div>
              <p className={cn("text-sm font-bold uppercase tracking-wider", PATH_STYLE[pathId].text)}>{path.name} path</p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{role.title}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">{role.summary}</p>
          {path.warning && (
            <Notice tone="warning" className="mt-4">
              {path.warning}
            </Notice>
          )}
          {evaluation.steppingStone && (
            <Notice className="mt-4" title={`Consider a stepping stone: ${evaluation.steppingStone.roleTitle}`}>
              Your overlap with {role.title} is {pct(evaluation.overlap)}; with {evaluation.steppingStone.roleTitle} it&apos;s{" "}
              {pct(evaluation.steppingStone.overlap)}. Many people move there first and build analysis experience on the job.
            </Notice>
          )}
        </div>
        <Card>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div>
              <dt className="text-xs text-muted">Overlap</dt>
              <dd className="font-display text-2xl font-bold">{pct(evaluation.overlap)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Effort</dt>
              <dd className="font-display text-2xl font-bold">{evaluation.effort}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Est. weeks</dt>
              <dd className="font-display text-2xl font-bold">
                {evaluation.weeksLow}–{evaluation.weeksHigh}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-center text-xs text-faint">
            Planning range at your weekly time budget, not a promise. Path fit {pct(evaluation.fit)}.
          </p>
          {!isSelected && (
            <Button className="mt-5 w-full" onClick={() => selectPath(pathId)}>
              Make {path.name} my path
            </Button>
          )}
          {isSelected && (
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted">Plan progress</span>
                <span className="font-semibold">
                  {doneCount}/{items.length} done
                </span>
              </div>
              <ProgressBar value={items.length ? doneCount / items.length : 0} tone="mint" label="Plan progress" />
            </div>
          )}
        </Card>
      </div>

      {!isSelected && (
        <Notice className="mt-6" title="Preview">
          This is a preview of the {path.name} plan computed from your answers. {state.selectedPathId ? `Your current path is ${PATH_BY_ID[state.selectedPathId].name}. ` : ""}
          Make it your path to save progress.
        </Notice>
      )}

      {/* Gap map */}
      <section className="mt-12" aria-labelledby="gapmap">
        <SectionTitle
          eyebrow="Skill-gap map"
          title={<span id="gapmap">What {role.title} asks for, against your estimate</span>}
          description="Bars show your current estimate (self-report + task evidence + any demonstrated scores). The marker shows the level this role uses weekly."
        />
        <Card className="mt-6">
          <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
            {(Object.entries(role.requirements) as [SkillId, { level: number; importance: number }][])
              .sort((a, b) => b[1].importance - a[1].importance)
              .map(([skill, req]) => {
                const cur = results.profile[skill].effective;
                const gap = Math.max(0, req.level - cur);
                return (
                  <div key={skill}>
                    <div className="mb-1.5 flex justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {SKILL_BY_ID[skill].name}{" "}
                        <span className="text-xs text-faint">{["", "nice to have", "important", "core"][req.importance]}</span>
                      </span>
                      <span className={cn("shrink-0 text-xs", gap > 0 ? "text-amber" : "text-mint")}>
                        {gap > 0 ? `gap ${gap.toFixed(1)}` : "covered"}
                      </span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-white/[0.06]">
                      <div className={cn("h-full rounded-full", gap > 0 ? "bg-lavender/70" : "bg-mint-strong")} style={{ width: `${(Math.min(cur, 4) / 4) * 100}%` }} />
                      <div className="absolute -top-1 h-4.5 w-0.5 bg-amber" style={{ left: `${(req.level / 4) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </section>

      {/* 14-day plan */}
      <section className="mt-12" aria-labelledby="plan">
        <SectionTitle
          eyebrow="Your 14-day plan"
          title={<span id="plan">{items.length} sessions, about {Math.round(minutes / 60)} hours over two weeks</span>}
          description="Generated from your biggest weighted gaps for this path and your weekly time. Change your answers or your path and the plan changes."
        />
        {[1, 2].map((w) => {
          const weekItems = items.filter((i) => i.week === w);
          const timeLocked = isSelected && w === 2 && week < 2;
          return (
            <div key={w} className="mt-8">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold">
                  Week {w}{" "}
                  {isSelected && week === w && (
                    <Badge tone="mint" className="ml-2 align-middle">
                      This week
                    </Badge>
                  )}
                </h3>
                {timeLocked && unlockAt && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4 text-lavender" aria-hidden /> Opens {formatDate(unlockAt)}
                    </span>
                    <Button size="sm" variant="outline" onClick={advanceDemoWeek}>
                      <FastForward className="size-3.5" aria-hidden /> Demo: advance to next week
                    </Button>
                  </div>
                )}
              </div>
              <ol className="space-y-3">
                {weekItems.map((item) => (
                  <PlanItemRow
                    key={item.id}
                    item={item}
                    state={state}
                    interactive={isSelected}
                    timeLocked={timeLocked}
                    planStart={state.plan?.generatedAt ?? null}
                  />
                ))}
              </ol>
            </div>
          );
        })}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <Card>
          <p className="font-display text-lg font-bold">Ways to start at your current job</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {path.entryPoints.map((e) => (
              <li key={e} className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-lavender" aria-hidden />
                {e}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="font-display text-lg font-bold">Uncertainty</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{path.uncertainty}</p>
          {path.extraPrepLabel && <p className="mt-3 text-sm text-muted">Extra preparation included in the estimate: {path.extraPrepLabel}.</p>}
        </Card>
      </section>
    </Container>
  );
}

const REVIEW_PROMPTS: Record<1 | 2, string[]> = {
  1: [
    "What did you finish this week, and what did you skip?",
    "Which session felt hardest, and why?",
    "What is the one thing you'll prioritize next week?",
  ],
  2: [
    "Compare your challenge scores: what changed and what didn't?",
    "Which skill would you now rate differently? Update your answers if so (Edit answers on your career map).",
    "What is your next concrete step at your current job?",
  ],
};

function PlanItemRow({
  item,
  state,
  interactive,
  timeLocked,
  planStart,
}: {
  item: PlanItem;
  state: AppState;
  interactive: boolean;
  timeLocked: boolean;
  planStart: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(state.completedItems[item.id]?.note ?? "");
  const done = Boolean(state.completedItems[item.id]);
  const paid = !hasAccess(state, item.access);
  const mod = item.moduleId ? MODULE_BY_ID[item.moduleId] : null;
  const date = planStart ? formatDate(planStart + (item.day - 1) * DAY_MS) : null;
  const expandable = item.kind === "module" || item.kind === "review" || paid;

  return (
    <li>
      <div className={cn("surface rounded-2xl transition-colors", done && "border-mint/30", timeLocked && "opacity-60")}>
        <div className="flex items-center gap-3 p-4">
          <div
            className={cn(
              "flex size-10 shrink-0 flex-col items-center justify-center rounded-xl text-center",
              done ? "bg-mint/15 text-mint" : "bg-black/25 text-soft",
            )}
          >
            {done ? <Check className="size-5" aria-label="Done" /> : <span className="font-display text-sm font-bold leading-none">D{item.day}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug">{item.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
              {date && <span>{date}</span>}
              <span>{item.minutes} min</span>
              {item.skill && <span>{SKILL_BY_ID[item.skill as SkillId]?.name}</span>}
              {item.access !== "free" && (
                <Badge tone={paid ? "muted" : "lavender"} className="py-0 text-[10px]">
                  {item.access === "plus" ? "Plus" : "Blueprint"}
                </Badge>
              )}
            </p>
          </div>
          <div className="shrink-0">
            {timeLocked ? (
              <span className="inline-flex items-center gap-1 text-xs text-faint">
                <Clock className="size-3.5" aria-hidden /> Week 2
              </span>
            ) : paid ? (
              <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                <Lock className="size-3.5" aria-hidden /> Unlock
              </Button>
            ) : item.href ? (
              <ButtonLink href={item.href} size="sm" variant={done ? "secondary" : "primary"}>
                <PlayCircle className="size-3.5" aria-hidden /> {done ? "Review" : "Start"}
              </ButtonLink>
            ) : expandable ? (
              <Button size="sm" variant={done ? "ghost" : "secondary"} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                {done ? "Done" : "Open"} <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
        {open && !timeLocked && (
          <div className="border-t border-line p-4">
            {paid ? (
              <PaywallCard tier={item.access as "blueprint" | "plus"} context={`plan:${item.kind}`} />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  <span className="font-semibold text-soft">Outcome: </span>
                  {item.outcome}
                </p>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                  {(mod?.steps ?? REVIEW_PROMPTS[item.week]).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {interactive ? (
                  <div>
                    <label htmlFor={`note-${item.id}`} className="text-sm font-semibold">
                      Notes <span className="font-normal text-faint">(optional, saved on this device)</span>
                    </label>
                    <textarea
                      id={`note-${item.id}`}
                      className="input mt-1.5"
                      maxLength={1000}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={item.kind === "review" ? "Your reflection…" : "What you did, what you learned…"}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant={done ? "secondary" : "mint"} onClick={() => toggleItemComplete(item.id, note)}>
                        <Check className="size-3.5" aria-hidden /> {done ? "Save note" : "Mark as done"}
                      </Button>
                      {done && (
                        <Button size="sm" variant="ghost" onClick={() => toggleItemComplete(item.id)}>
                          Mark as not done
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-faint">Make this your path to track progress.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
