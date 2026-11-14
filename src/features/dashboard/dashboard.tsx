"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock, Database, FastForward, Lock, RotateCcw, Trash2 } from "lucide-react";
import { PathGlyph } from "@/components/brand";
import { Badge, Button, ButtonLink, Card, Container, Notice, ProgressBar, SectionTitle } from "@/components/ui";
import { NoAssessment } from "@/features/careers/no-assessment";
import { PATH_BY_ID } from "@/lib/data/paths";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { CATALOG_DATE, CATALOG_VERSION } from "@/lib/data/sources";
import { CATEGORY_META } from "@/lib/data/tasks";
import type { PlanItem } from "@/lib/engine/plan";
import {
  advanceDemoWeek,
  currentPlanWeek,
  effectiveNow,
  hasAccess,
  nextWeekUnlockAt,
  resetDemoTime,
} from "@/lib/storage/actions";
import { useCareerResults } from "@/lib/storage/derived";
import type { AppState } from "@/lib/storage/schema";
import { getStorageInfo, resetAll, useAppState } from "@/lib/storage/store";
import { cn, formatDate, formatDateTime, pct } from "@/lib/utils";
import type { ChallengeAttempt, SkillId, TaskCategory } from "@/types";

const CHALLENGE_NAMES: Record<string, string> = {
  "cs-portfolio": "Customer Success portfolio",
  "cs-sprint": "Week 2 Skill Sprint",
  "ai-draft-review": "AI draft review",
  "ops-volume": "Ops analysis",
};

export function Dashboard() {
  const state = useAppState();
  const results = useCareerResults(state);

  if (!results) {
    return (
      <>
        <NoAssessment title="Your plan starts with a free career check" />
        <Container>
          <DataPanel state={state} />
        </Container>
      </>
    );
  }

  if (!state.selectedPathId || !state.plan) {
    return (
      <Container className="py-14">
        <Card className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-2xl font-bold">Pick a path to start your plan</h1>
          <p className="mt-3 text-muted">
            Your career map is ready. We recommend <strong className="text-ink">{PATH_BY_ID[results.recommended].name}</strong>, but you
            can choose any of the three.
          </p>
          <ButtonLink href="/results#paths" className="mt-6">
            Compare the three paths <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </Card>
        <DataPanel state={state} />
      </Container>
    );
  }

  return <PlanDashboard state={state} results={results} />;
}

function PlanDashboard({ state, results }: { state: AppState; results: NonNullable<ReturnType<typeof useCareerResults>> }) {
  const plan = state.plan!;
  const pathId = plan.pathId;
  const path = PATH_BY_ID[pathId];
  const evaluation = results.evaluations.find((e) => e.pathId === pathId)!;
  const items = plan.items as PlanItem[];
  const week = currentPlanWeek(state);
  const viewWeek = Math.min(Math.max(week, 1), 2) as 1 | 2;
  const unlockAt = nextWeekUnlockAt(state);
  const now = effectiveNow(state);

  const isOpen = (i: PlanItem) => i.week <= week;
  const weekItems = items.filter((i) => i.week === viewWeek);
  const weekDone = weekItems.filter((i) => state.completedItems[i.id]).length;
  const allDone = items.filter((i) => state.completedItems[i.id]).length;
  const next = items.find((i) => isOpen(i) && hasAccess(state, i.access) && !state.completedItems[i.id]);
  const nextHref = next?.href ?? `/path/${pathId}`;
  const upcoming = items.filter((i) => i.week === 2);

  const attemptsByChallenge = useMemo(() => {
    const map: Record<string, ChallengeAttempt[]> = {};
    for (const a of state.attempts) (map[a.challengeId] ??= []).push(a);
    return map;
  }, [state.attempts]);
  const latestOf = (id: string, stage?: string) =>
    (attemptsByChallenge[id] ?? []).filter((a) => !stage || a.stage === stage).sort((a, b) => b.at - a.at)[0];
  const baseline = latestOf("cs-portfolio", "baseline");
  const transfer = latestOf("cs-portfolio", "transfer");
  const nextSkill = evaluation.gaps[0];

  return (
    <Container className="py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <PathGlyph pathId={pathId} className="size-14" />
          <div>
            <p className="text-sm font-semibold text-lavender">Your plan · {path.name}</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{evaluation.roleTitle}</h1>
            <p className="mt-1 text-sm text-muted">
              Started {formatDate(plan.generatedAt)} · Today {formatDate(now)}
              {state.demoDayOffset > 0 && (
                <Badge tone="amber" className="ml-2">
                  Demo time +{state.demoDayOffset} days
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={nextHref} size="lg">
            Continue my plan <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Weekly mission */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-xl font-bold">{week > 2 ? "Your 14-day plan is complete" : `Week ${viewWeek} mission`}</p>
            <Badge tone="mint">
              {weekDone}/{weekItems.length} done this week
            </Badge>
          </div>
          <ProgressBar className="mt-4" value={weekItems.length ? weekDone / weekItems.length : 0} tone="mint" label="This week's progress" />
          <ul className="mt-5 space-y-2">
            {weekItems.map((i) => {
              const done = Boolean(state.completedItems[i.id]);
              const locked = !hasAccess(state, i.access);
              return (
                <li key={i.id} className="flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2.5 text-sm">
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg", done ? "bg-mint/20 text-mint" : "bg-white/5 text-faint")}>
                    {done ? <Check className="size-3.5" aria-label="Done" /> : locked ? <Lock className="size-3" aria-label="Locked" /> : <span className="text-[10px] font-bold">D{i.day}</span>}
                  </span>
                  <span className={cn("flex-1", done && "text-muted line-through decoration-faint")}>{i.title}</span>
                  {locked && <span className="text-xs text-faint">{i.access === "plus" ? "Plus" : "Blueprint"}</span>}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted">
            {next ? (
              <>
                Next up: <strong className="text-ink">{next.title}</strong> ({next.minutes} min)
              </>
            ) : (
              "Nothing open right now. Check when your next week unlocks."
            )}
          </p>
          <Link href={`/path/${pathId}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-lavender hover:text-soft">
            Full 14-day plan · {allDone}/{items.length} done <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>

        {/* Return loop */}
        <Card className="flex flex-col">
          <p className="inline-flex items-center gap-2 font-display text-xl font-bold">
            <CalendarDays className="size-5 text-lavender" aria-hidden /> Weekly return
          </p>
          {week < 2 ? (
            <>
              <p className="mt-3 text-sm text-muted">
                Week 2 opens <strong className="text-ink">{unlockAt ? formatDate(unlockAt) : "next week"}</strong> with {upcoming.length} new
                sessions{pathId === "pivot" && ", including the Week 2 Skill Sprint (Plus)"}.
              </p>
              <p className="mt-2 text-xs text-faint">Sessions are spaced on purpose. Practice over two weeks sticks better than one long sitting.</p>
            </>
          ) : week === 2 ? (
            <p className="mt-3 text-sm text-muted">Week 2 is open. Finish it to complete your 14-day plan.</p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              You&apos;re past day 14. Plus members get a new Skill Sprint each week; everyone can redo challenges and review their evidence.
            </p>
          )}
          <div className="mt-auto space-y-2 pt-5">
            <Button variant="outline" className="w-full" onClick={advanceDemoWeek}>
              <FastForward className="size-4" aria-hidden /> Demo: advance to next week
            </Button>
            {state.demoDayOffset > 0 && (
              <Button variant="ghost" size="sm" className="w-full" onClick={resetDemoTime}>
                <RotateCcw className="size-3.5" aria-hidden /> Back to real time
              </Button>
            )}
            <p className="text-center text-[11px] text-faint">Demo control for reviewers: shifts this device&apos;s plan clock by 7 days.</p>
          </div>
        </Card>
      </div>

      {/* Before / after */}
      <section className="mt-12">
        <SectionTitle eyebrow="Skill evidence" title="Before and after, from your actual attempts" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            {baseline ? (
              <div>
                <p className="text-sm font-semibold text-soft">Customer Success portfolio challenge</p>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                  <div>
                    <p className="font-display text-4xl font-bold">{baseline.total}</p>
                    <p className="text-xs text-muted">Before · {formatDate(baseline.at)}</p>
                  </div>
                  <ArrowRight className="size-5 text-faint" aria-hidden />
                  <div>
                    <p className="font-display text-4xl font-bold">{transfer ? transfer.total : "—"}</p>
                    <p className="text-xs text-muted">{transfer ? `After · ${formatDate(transfer.at)}` : "After: not done yet"}</p>
                  </div>
                </div>
                {transfer && (
                  <p className={cn("mt-4 text-center text-sm font-semibold", transfer.total > baseline.total ? "text-mint" : transfer.total < baseline.total ? "text-coral" : "text-muted")}>
                    {transfer.total > baseline.total
                      ? `+${transfer.total - baseline.total} points on a new portfolio`
                      : transfer.total < baseline.total
                        ? `${transfer.total - baseline.total} points. Review the feedback and try the sprint next.`
                        : "Same score on a new portfolio"}
                  </p>
                )}
                <div className="mt-5 text-center">
                  <ButtonLink href="/challenge/cs-portfolio" variant="secondary" size="sm">
                    {transfer ? "Review results" : "Continue the challenge"}
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted">No challenge attempts yet. Your before/after comparison will appear here.</p>
                <ButtonLink href={items[0]?.href ?? "/challenge/cs-portfolio"} className="mt-4">
                  Start your first challenge
                </ButtonLink>
              </div>
            )}
          </Card>
          <Card>
            <p className="text-sm font-semibold text-soft">All exercise attempts</p>
            {state.attempts.length === 0 ? (
              <p className="mt-3 text-sm text-faint">None yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {state.attempts
                  .slice()
                  .sort((a, b) => b.at - a.at)
                  .slice(0, 6)
                  .map((a) => (
                    <li key={a.id} className="flex justify-between gap-2">
                      <span className="text-muted">
                        {CHALLENGE_NAMES[a.challengeId] ?? a.challengeId}
                        {a.stage !== "single" && ` (${a.stage === "baseline" ? "before" : "after"})`}
                      </span>
                      <span className="shrink-0 font-semibold">{a.total}</span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {/* Skills Snapshot */}
      <section className="mt-12">
        <SectionTitle
          eyebrow="Skills Snapshot"
          title="Where you stand for this path"
          description={`Your self-ratings next to measured evidence from exercises. Catalog ${CATALOG_VERSION}, as of ${CATALOG_DATE}. This is a curated snapshot, not a live labor-market feed.`}
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-faint">
                <tr>
                  <th className="pb-2 font-semibold">Skill</th>
                  <th className="pb-2 font-semibold">Self-rated</th>
                  <th className="pb-2 font-semibold">Demonstrated</th>
                  <th className="pb-2 font-semibold">Needed</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(ROLE_BY_ID[evaluation.roleId].requirements) as [SkillId, { level: number; importance: number }][])
                  .sort((a, b) => b[1].importance - a[1].importance)
                  .map(([skill, req]) => {
                    const p = results.profile[skill];
                    return (
                      <tr key={skill} className="border-t border-line">
                        <td className="py-2 pr-2">{SKILL_BY_ID[skill].name}</td>
                        <td className="py-2 text-muted">{p.self}/4</td>
                        <td className={cn("py-2", p.demonstrated !== null ? "font-semibold text-mint" : "text-faint")}>
                          {p.demonstrated !== null ? `${p.demonstrated}/4` : "—"}
                        </td>
                        <td className="py-2">{req.level}/4</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </Card>
          <div className="space-y-4">
            <Card>
              <p className="text-sm font-semibold text-lavender">Next skill to focus on</p>
              {nextSkill ? (
                <>
                  <p className="mt-1 font-display text-xl font-bold">{SKILL_BY_ID[nextSkill.skill].name}</p>
                  <p className="mt-1 text-sm text-muted">
                    Largest weighted gap for {evaluation.roleTitle}: {nextSkill.current.toFixed(1)} → {nextSkill.required}.
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">No gaps against this profile. Use sprints to keep your skills sharp.</p>
              )}
            </Card>
            <Card>
              <p className="text-sm font-semibold text-soft">Your task mix</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {(Object.entries(results.taskMap.shares) as [TaskCategory, number][]).map(([cat, share]) => (
                  <li key={cat} className="flex justify-between">
                    <span className="text-muted">{CATEGORY_META[cat].label}</span>
                    <span className="font-semibold">{pct(share)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <DataPanel state={state} />
    </Container>
  );
}

function DataPanel({ state }: { state: AppState }) {
  const [confirm, setConfirm] = useState(false);
  const info = getStorageInfo();
  const counts = state.events.reduce<Record<string, number>>((acc, e) => ((acc[e.name] = (acc[e.name] ?? 0) + 1), acc), {});
  return (
    <section id="data" className="mt-12 scroll-mt-24">
      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 font-display text-lg font-bold">
              <Database className="size-5 text-lavender" aria-hidden /> Your data
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {info.mode === "local"
                ? "Guest mode: your answers, plan, attempts and progress are stored only in this browser on this device (localStorage). Nothing is sent to a server."
                : "Your browser blocked local storage, so progress is kept in memory only and will be lost when you close this tab."}
            </p>
            {info.recoveredFromCorruption && (
              <Notice tone="warning" className="mt-3">
                Saved data on this device was unreadable or from an unknown version, so we started fresh.
              </Notice>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-soft">Local activity log ({state.events.length} events, never uploaded)</summary>
              <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
                {Object.entries(counts).map(([name, n]) => (
                  <li key={name}>
                    <code>{name}</code>: {n}
                  </li>
                ))}
              </ul>
              {state.events.length > 0 && (
                <p className="mt-2 text-xs text-faint">Latest: {formatDateTime(state.events[state.events.length - 1].at)}</p>
              )}
            </details>
          </div>
          <div className="shrink-0">
            {!confirm ? (
              <Button variant="secondary" onClick={() => setConfirm(true)}>
                <Trash2 className="size-4" aria-hidden /> Reset my demo data
              </Button>
            ) : (
              <div className="rounded-2xl border border-coral/40 bg-coral/10 p-4">
                <p className="text-sm font-semibold">Delete all answers, plan and progress on this device?</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-coral text-bg [background-image:none]"
                    onClick={() => {
                      resetAll();
                      setConfirm(false);
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    Yes, reset
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
        <Clock className="size-3.5" aria-hidden /> Cross-device sync would need an optional account. It isn&apos;t built in this version.
      </p>
    </section>
  );
}
