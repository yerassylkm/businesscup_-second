"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Clock, FastForward, RotateCcw } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Container, Notice } from "@/components/ui";
import { PaywallCard } from "@/features/billing/paywall";
import { AI_DRAFT_REVIEW, OPS_VOLUME } from "@/lib/data/exercises";
import { SCENARIO_SPRINT } from "@/lib/data/scenarios";
import { scoreDraftReview, scoreOps, type DraftReviewAnswer, type OpsAnswer } from "@/lib/engine/exercises";
import { scorePortfolio } from "@/lib/engine/portfolio";
import { advanceDemoWeek, currentPlanWeek, hasAccess, nextWeekUnlockAt, recordAttempt } from "@/lib/storage/actions";
import { useAppState } from "@/lib/storage/store";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { ChallengeAttempt, PathId, PortfolioAnswer, ScoreResult } from "@/types";
import { Err, PortfolioForm, Radio } from "./portfolio-form";
import { ScoreReport } from "./score-report";

function lastAttempt(attempts: ChallengeAttempt[], challengeId: string) {
  return [...attempts].filter((a) => a.challengeId === challengeId).sort((a, b) => b.at - a.at)[0];
}

function save(challengeId: string, scenarioId: string, pathId: PathId, result: ScoreResult, answer: unknown) {
  recordAttempt({
    challengeId,
    scenarioId,
    stage: "single",
    pathId,
    total: result.total,
    max: result.max,
    dimensions: result.dimensions.map(({ id, label, points, max }) => ({ id, label, points, max })),
    skillEvidence: result.skillEvidence,
    answer,
  });
}

function Header({ badge, title, intro, single = true }: { badge: string; title: string; intro: string; single?: boolean }) {
  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap gap-2">
        <Badge tone="lavender">{badge}</Badge>
        {single && <Badge tone="muted">Single skill check</Badge>}
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 leading-relaxed text-muted">{intro}</p>
    </div>
  );
}

function AttemptHistory({ attempts }: { attempts: ChallengeAttempt[] }) {
  if (attempts.length < 2) return null;
  return (
    <Card>
      <p className="text-sm font-semibold">Your attempts</p>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {attempts
          .slice()
          .sort((a, b) => a.at - b.at)
          .map((a, i) => (
            <li key={a.id}>
              Attempt {i + 1}: {a.total}/100 · {formatDateTime(a.at)}
            </li>
          ))}
      </ul>
    </Card>
  );
}

/* ---------- Week-2 Skill Sprint (Plus) ---------- */

export function SprintChallenge() {
  const state = useAppState();
  const attempt = lastAttempt(state.attempts, "cs-sprint");
  const [redo, setRedo] = useState(0);
  const [showForm, setShowForm] = useState(!attempt);
  const result = useMemo(() => (attempt ? scorePortfolio(SCENARIO_SPRINT, attempt.answer as PortfolioAnswer) : null), [attempt]);
  const access = hasAccess(state, "plus");
  const hasPlan = Boolean(state.plan);
  const week = currentPlanWeek(state);
  const unlockAt = nextWeekUnlockAt(state);
  const timeLocked = hasPlan ? week < 2 : false;

  return (
    <Container className="py-10 sm:py-14">
      <Header
        badge="Plus · Week 2 Skill Sprint"
        title="Skill Sprint: one more portfolio, a bit harder"
        intro="A third customer portfolio with new data. Same rubric as the flagship challenge, so your scores stay comparable week to week."
        single={false}
      />
      <div className="mt-8">
        {!access ? (
          <div className="max-w-2xl">
            <PaywallCard tier="plus" context="sprint" />
          </div>
        ) : timeLocked ? (
          <Card className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-semibold">
              <Clock className="size-4 text-lavender" aria-hidden /> Unlocks in week 2 of your plan
              {unlockAt && <span className="font-normal text-muted">({formatDate(unlockAt)})</span>}
            </p>
            <p className="mt-2 text-sm text-muted">
              Weekly sprints open on a schedule so practice is spaced over time. Reviewing the product? Use the clearly labeled demo
              control to jump ahead.
            </p>
            <Button className="mt-4" variant="outline" onClick={advanceDemoWeek}>
              <FastForward className="size-4" aria-hidden /> Demo: advance to next week
            </Button>
          </Card>
        ) : showForm || !result ? (
          <PortfolioForm
            key={redo}
            scenario={SCENARIO_SPRINT}
            onSubmit={(answer) => {
              const r = scorePortfolio(SCENARIO_SPRINT, answer);
              save("cs-sprint", SCENARIO_SPRINT.id, "pivot", r, answer);
              setShowForm(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <ScoreReport title={`Sprint · ${SCENARIO_SPRINT.title}`} total={result.total} max={100} dimensions={result.dimensions} portfolio={{ result, scenario: SCENARIO_SPRINT }} />
            <div className="space-y-4">
              <Card>
                <p className="font-display text-lg font-bold">Sprint complete</p>
                <p className="mt-2 text-sm text-muted">Your score is added to your skill evidence on the dashboard.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ButtonLink href="/dashboard">Back to my plan</ButtonLink>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRedo((r) => r + 1);
                      setShowForm(true);
                    }}
                  >
                    <RotateCcw className="size-4" aria-hidden /> Try again
                  </Button>
                </div>
              </Card>
              <AttemptHistory attempts={state.attempts.filter((a) => a.challengeId === "cs-sprint")} />
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}

/* ---------- Adapt: AI draft review ---------- */

export function DraftReviewChallenge() {
  const state = useAppState();
  const attempt = lastAttempt(state.attempts, AI_DRAFT_REVIEW.id);
  const [showForm, setShowForm] = useState(!attempt);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [decisionId, setDecision] = useState<string>();
  const [replacementId, setReplacement] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const result = useMemo(() => (attempt ? scoreDraftReview(attempt.answer as DraftReviewAnswer) : null), [attempt]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!decisionId) errs.decision = "Choose what you'd do with this draft.";
    if (!replacementId) errs.replacement = "Choose a rewrite.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const answer: DraftReviewAnswer = { flagged, decisionId: decisionId!, replacementId: replacementId! };
    save(AI_DRAFT_REVIEW.id, AI_DRAFT_REVIEW.id, "adapt", scoreDraftReview(answer), answer);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Container className="py-10 sm:py-14">
      <Header
        badge="Adapt · AI output verification"
        title={AI_DRAFT_REVIEW.title}
        intro="AI tools now draft many support replies. The human skill that grows in value is catching what the draft gets wrong before a customer reads it."
      />
      <div className="mt-8">
        {showForm || !result ? (
          <form onSubmit={submit} noValidate className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <p className="text-xs font-bold uppercase tracking-wider text-faint">Customer ticket</p>
                <p className="mt-2 font-semibold">
                  {AI_DRAFT_REVIEW.ticket.subject} <span className="font-normal text-muted">from {AI_DRAFT_REVIEW.ticket.from}</span>
                </p>
                <p className="mt-2 leading-relaxed text-muted">{AI_DRAFT_REVIEW.ticket.body}</p>
              </Card>
              <Card>
                <p className="text-xs font-bold uppercase tracking-wider text-faint">Company policy (knowledge base)</p>
                <ul className="mt-2 space-y-2 text-sm text-muted">
                  {AI_DRAFT_REVIEW.policy.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lavender" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <Card>
              <fieldset>
                <legend className="font-display text-lg font-bold">1. Flag every sentence that breaks policy or isn&apos;t true</legend>
                <p className="mt-1 text-sm text-muted">AI-drafted reply. Click sentences to flag them. Wrong flags cost points.</p>
                <div className="mt-4 space-y-2">
                  {AI_DRAFT_REVIEW.sentences.map((s, i) => {
                    const on = flagged.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lavender",
                          on ? "border-coral/60 bg-coral/10" : "border-line hover:border-line-strong",
                        )}
                      >
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => setFlagged(on ? flagged.filter((x) => x !== s.id) : [...flagged, s.id])} />
                        <span className="w-5 shrink-0 text-sm text-faint">{i + 1}</span>
                        <span className="flex-1 text-[15px]">{s.text}</span>
                        {on && <Badge tone="coral">Flagged</Badge>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </Card>
            <Card>
              <fieldset>
                <legend className="font-display text-lg font-bold">2. What do you do with this draft?</legend>
                <div className="mt-4 grid gap-2">
                  {AI_DRAFT_REVIEW.decisionOptions.map((d) => (
                    <Radio key={d.id} name="decision" checked={decisionId === d.id} onChange={() => setDecision(d.id)} label={d.label} />
                  ))}
                </div>
                <Err msg={errors.decision} />
              </fieldset>
              <fieldset className="mt-6">
                <legend className="font-display text-lg font-bold">3. Pick the correct rewrite of the refund sentence</legend>
                <div className="mt-4 grid gap-2">
                  {AI_DRAFT_REVIEW.replacementOptions.map((r) => (
                    <Radio key={r.id} name="replacement" checked={replacementId === r.id} onChange={() => setReplacement(r.id)} label={r.label} />
                  ))}
                </div>
                <Err msg={errors.replacement} />
              </fieldset>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Submit my review <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </form>
        ) : (
          <ExerciseResult
            title="AI draft review"
            result={result}
            attempts={state.attempts.filter((a) => a.challengeId === AI_DRAFT_REVIEW.id)}
            onRetry={() => {
              setFlagged([]);
              setDecision(undefined);
              setReplacement(undefined);
              setShowForm(true);
            }}
            pathId="adapt"
          />
        )}
      </div>
    </Container>
  );
}

/* ---------- Reinvent: ops volume ---------- */

export function OpsChallenge() {
  const state = useAppState();
  const attempt = lastAttempt(state.attempts, OPS_VOLUME.id);
  const [showForm, setShowForm] = useState(!attempt);
  const [categoryId, setCategory] = useState<string>();
  const [hours, setHours] = useState("");
  const [metricId, setMetric] = useState<string>();
  const [caveatId, setCaveat] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const result = useMemo(() => (attempt ? scoreOps(attempt.answer as OpsAnswer) : null), [attempt]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const h = Number(hours);
    if (!categoryId) errs.category = "Choose a category.";
    if (hours.trim() === "" || !Number.isFinite(h) || h < 0 || h > 1000) errs.hours = "Enter a number of hours between 0 and 1000.";
    if (!metricId) errs.metric = "Choose a metric.";
    if (!caveatId) errs.caveat = "Choose what to check first.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const answer: OpsAnswer = { categoryId: categoryId!, hoursEstimate: h, metricId: metricId!, caveatId: caveatId! };
    save(OPS_VOLUME.id, OPS_VOLUME.id, "reinvent", scoreOps(answer), answer);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Container className="py-10 sm:py-14">
      <Header
        badge="Reinvent · operations analysis"
        title={OPS_VOLUME.title}
        intro="Operations analysts turn messy operational data into a clear recommendation. Your frontline knowledge helps, but the numbers have to back it up."
      />
      <div className="mt-8">
        {showForm || !result ? (
          <form onSubmit={submit} noValidate className="space-y-6">
            <Card>
              <p className="leading-relaxed text-muted">{OPS_VOLUME.context}</p>
              <fieldset className="mt-5">
                <legend className="font-display text-lg font-bold">1. Which category would you automate first?</legend>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-black/30 text-xs uppercase tracking-wider text-faint">
                      <tr>
                        <th className="px-3 py-3 font-semibold">Pick</th>
                        <th className="px-3 py-3 font-semibold">Category</th>
                        <th className="px-3 py-3 font-semibold">Tickets / week</th>
                        <th className="px-3 py-3 font-semibold">Minutes / ticket</th>
                        <th className="px-3 py-3 font-semibold">Standard steps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {OPS_VOLUME.categories.map((c) => (
                        <tr key={c.id} className={cn("cursor-pointer border-t border-line", categoryId === c.id && "bg-brand/15")} onClick={() => setCategory(c.id)}>
                          <td className="px-3 py-3">
                            <input type="radio" name="cat" checked={categoryId === c.id} onChange={() => setCategory(c.id)} aria-label={`Automate ${c.name} first`} className="size-4 accent-[#a79bff]" />
                          </td>
                          <td className="px-3 py-3 font-medium">{c.name}</td>
                          <td className="px-3 py-3">{c.weeklyVolume}</td>
                          <td className="px-3 py-3">{c.minutesPerTicket}</td>
                          <td className="px-3 py-3">{Math.round(c.standardShare * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Err msg={errors.category} />
              </fieldset>
              <div className="mt-6">
                <label htmlFor="hours" className="font-display text-lg font-bold">
                  2. If its standard-step tickets were fully automated, how many agent hours per week would that free?
                </label>
                <input
                  id="hours"
                  inputMode="decimal"
                  className="input mt-3 max-w-[200px]"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. 12.5"
                  aria-invalid={Boolean(errors.hours)}
                />
                <Err msg={errors.hours} />
              </div>
            </Card>
            <Card>
              <fieldset>
                <legend className="font-display text-lg font-bold">3. Which metric proves it worked?</legend>
                <div className="mt-4 grid gap-2">
                  {OPS_VOLUME.metricOptions.map((m) => (
                    <Radio key={m.id} name="metric" checked={metricId === m.id} onChange={() => setMetric(m.id)} label={m.label} />
                  ))}
                </div>
                <Err msg={errors.metric} />
              </fieldset>
              <fieldset className="mt-6">
                <legend className="font-display text-lg font-bold">4. What should you check before investing?</legend>
                <div className="mt-4 grid gap-2">
                  {OPS_VOLUME.caveatOptions.map((c) => (
                    <Radio key={c.id} name="caveat" checked={caveatId === c.id} onChange={() => setCaveat(c.id)} label={c.label} />
                  ))}
                </div>
                <Err msg={errors.caveat} />
              </fieldset>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Submit my analysis <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </form>
        ) : (
          <ExerciseResult
            title="Ops analysis"
            result={result}
            attempts={state.attempts.filter((a) => a.challengeId === OPS_VOLUME.id)}
            onRetry={() => {
              setCategory(undefined);
              setHours("");
              setMetric(undefined);
              setCaveat(undefined);
              setShowForm(true);
            }}
            pathId="reinvent"
          />
        )}
      </div>
    </Container>
  );
}

function ExerciseResult({
  title,
  result,
  attempts,
  onRetry,
  pathId,
}: {
  title: string;
  result: ScoreResult;
  attempts: ChallengeAttempt[];
  onRetry: () => void;
  pathId: PathId;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <ScoreReport title={title} total={result.total} max={result.max} dimensions={result.dimensions} />
      <div className="space-y-4">
        <Card>
          <p className="font-display text-lg font-bold">
            <Check className="mr-1 inline size-5 text-mint" aria-hidden /> Saved to your skill evidence
          </p>
          <p className="mt-2 text-sm text-muted">
            Your demonstrated score now feeds your career map alongside your self-ratings, clearly labeled as measured.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href={`/path/${pathId}`}>Back to my plan</ButtonLink>
            <Button variant="secondary" onClick={onRetry}>
              <RotateCcw className="size-4" aria-hidden /> Try again
            </Button>
          </div>
        </Card>
        <Notice>
          This path has a single scored skill check today. The full before → lesson → after cycle is built for the Pivot path. Adapt and
          Reinvent cycles are on our roadmap.
        </Notice>
        <AttemptHistory attempts={attempts} />
      </div>
    </div>
  );
}
