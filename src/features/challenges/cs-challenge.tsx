"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, ClipboardCopy, RotateCcw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Container, Notice, ScoreRing } from "@/components/ui";
import { CS_LESSON } from "@/lib/data/lessons";
import { SCENARIO_BASELINE, SCENARIO_TRANSFER } from "@/lib/data/scenarios";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { scorePortfolio, type PortfolioScoreResult } from "@/lib/engine/portfolio";
import { completeLesson, currentPlanWeek, hasAccess, nextWeekUnlockAt, recordAttempt } from "@/lib/storage/actions";
import { useAppState } from "@/lib/storage/store";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { ChallengeAttempt, PortfolioAnswer, SkillId } from "@/types";
import { PortfolioForm, Radio } from "./portfolio-form";
import { ScoreReport } from "./score-report";

const CHALLENGE_ID = "cs-portfolio";
type Stage = "intro" | "baseline" | "baseline_result" | "lesson" | "transfer" | "comparison";
const STEPS: { id: Stage[]; label: string }[] = [
  { id: ["intro", "baseline", "baseline_result"], label: "Before" },
  { id: ["lesson"], label: "Learn" },
  { id: ["transfer"], label: "After" },
  { id: ["comparison"], label: "Career Proof" },
];

function latest(attempts: ChallengeAttempt[], stage: "baseline" | "transfer") {
  return [...attempts].filter((a) => a.challengeId === CHALLENGE_ID && a.stage === stage).sort((a, b) => b.at - a.at)[0];
}

/** Re-score a saved attempt with the live engine (we store answers, not verdicts). */
function rescore(attempt: ChallengeAttempt | undefined, stage: "baseline" | "transfer"): PortfolioScoreResult | null {
  if (!attempt) return null;
  try {
    return scorePortfolio(stage === "baseline" ? SCENARIO_BASELINE : SCENARIO_TRANSFER, attempt.answer as PortfolioAnswer);
  } catch {
    return null;
  }
}

export function CustomerSuccessChallenge() {
  const state = useAppState();
  const baseline = latest(state.attempts, "baseline");
  const transfer = latest(state.attempts, "transfer");
  const lessonDone = Boolean(state.lessonsCompleted[CS_LESSON.id]);

  const initial: Stage = !baseline ? "intro" : !lessonDone ? "baseline_result" : !transfer || transfer.at < baseline.at ? "transfer" : "comparison";
  const [stage, setStage] = useState<Stage>(initial);
  const [formKey, setFormKey] = useState(0);

  const baselineResult = useMemo(() => rescore(baseline, "baseline"), [baseline]);
  const transferResult = useMemo(() => rescore(transfer, "transfer"), [transfer]);

  function go(s: Stage) {
    setStage(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit(stageName: "baseline" | "transfer", answer: PortfolioAnswer) {
    const scenario = stageName === "baseline" ? SCENARIO_BASELINE : SCENARIO_TRANSFER;
    const result = scorePortfolio(scenario, answer);
    recordAttempt({
      challengeId: CHALLENGE_ID,
      scenarioId: scenario.id,
      stage: stageName,
      pathId: "pivot",
      total: result.total,
      max: result.max,
      dimensions: result.dimensions.map(({ id, label, points, max }) => ({ id, label, points, max })),
      skillEvidence: result.skillEvidence,
      answer,
    });
    go(stageName === "baseline" ? "baseline_result" : "comparison");
  }

  const activeStep = STEPS.findIndex((s) => s.id.includes(stage));

  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-3xl">
        <div className="flex flex-wrap gap-2">
          <Badge tone="lavender">Pivot · flagship challenge</Badge>
          <Badge tone="muted">Customer Support → Customer Success</Badge>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Save the right customer, for the right reason</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Customer Success managers don&apos;t wait for tickets. They read account signals and act before customers leave. Try it
          on a real-looking portfolio, learn the method, then prove it on a portfolio you haven&apos;t seen.
        </p>
      </div>

      {/* Stepper */}
      <ol className="no-print mt-8 grid grid-cols-4 gap-2" aria-label="Challenge progress">
        {STEPS.map((s, i) => {
          const reachable =
            i === 0 || (i === 1 && !!baseline) || (i === 2 && !!baseline && lessonDone) || (i === 3 && !!transfer);
          const target: Stage = i === 0 ? (baseline ? "baseline_result" : "intro") : (s.id[0] as Stage);
          return (
            <li key={s.label}>
              <button
                disabled={!reachable}
                onClick={() => go(target)}
                aria-current={i === activeStep ? "step" : undefined}
                className={cn(
                  "w-full rounded-xl border px-2 py-2.5 text-left transition-colors disabled:cursor-not-allowed",
                  i === activeStep ? "border-lavender/60 bg-brand/20" : reachable ? "border-line hover:border-line-strong" : "border-line/50 opacity-50",
                )}
              >
                <span className="block text-[11px] font-bold uppercase tracking-wider text-faint">Step {i + 1}</span>
                <span className="block text-sm font-semibold">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8">
        {stage === "intro" && (
          <Card className="max-w-3xl">
            <h2 className="font-display text-xl font-bold">How this works (about 25 minutes)</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
              <li>
                <strong className="text-ink">Before:</strong> prioritize a 5-account portfolio, cite evidence, diagnose the risk, and write
                the first message.
              </li>
              <li>
                <strong className="text-ink">Learn:</strong> a 3-minute micro-lesson on health signals, root causes and follow-ups.
              </li>
              <li>
                <strong className="text-ink">After:</strong> a different company, different accounts, same skill. You decide on your own.
              </li>
              <li>
                <strong className="text-ink">Career Proof:</strong> your honest before/after comparison and the skills you practiced.
              </li>
            </ol>
            <p className="mt-4 text-sm text-faint">
              Rubric: prioritization 35 · evidence 25 · risk reasoning 20 · action & message 20. All companies are fictional.
            </p>
            <Button className="mt-6" size="lg" onClick={() => go("baseline")}>
              Start the baseline <ArrowRight className="size-4" aria-hidden />
            </Button>
          </Card>
        )}

        {stage === "baseline" && <PortfolioForm key={`b-${formKey}`} scenario={SCENARIO_BASELINE} onSubmit={(a) => submit("baseline", a)} />}

        {stage === "baseline_result" && baseline && baselineResult && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <ScoreReport
              title={`Baseline · ${SCENARIO_BASELINE.title}`}
              total={baselineResult.total}
              max={100}
              dimensions={baselineResult.dimensions}
              portfolio={{ result: baselineResult, scenario: SCENARIO_BASELINE }}
            />
            <div className="space-y-4">
              <Card>
                <p className="font-display text-lg font-bold">Next: learn the method</p>
                <p className="mt-2 text-sm text-muted">
                  A 3-minute lesson on what customer success managers look at, and how to turn it into the right action.
                </p>
                <Button className="mt-4 w-full" onClick={() => go("lesson")}>
                  <BookOpen className="size-4" aria-hidden /> Start the micro-lesson
                </Button>
              </Card>
              <Card>
                <p className="text-sm text-muted">Want to see how a different choice scores first?</p>
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => {
                    setFormKey((k) => k + 1);
                    go("baseline");
                  }}
                >
                  <RotateCcw className="size-4" aria-hidden /> Redo the baseline
                </Button>
                <p className="mt-2 text-xs text-faint">Every attempt is saved with a timestamp. Your latest one is used for the comparison.</p>
              </Card>
            </div>
          </div>
        )}

        {stage === "lesson" && <Lesson onDone={() => go("transfer")} alreadyDone={lessonDone} />}

        {stage === "transfer" && (
          <div>
            <Notice className="mb-6 max-w-3xl" title="New portfolio, same skill">
              Different company, different accounts, different numbers. The scoring rubric is the same one used in your baseline.
            </Notice>
            <PortfolioForm
              key={`t-${formKey}`}
              scenario={SCENARIO_TRANSFER}
              submitLabel="Submit and compare"
              onSubmit={(a) => submit("transfer", a)}
            />
          </div>
        )}

        {stage === "comparison" && baselineResult && transferResult && baseline && transfer && (
          <Comparison
            before={baselineResult}
            after={transferResult}
            beforeAt={baseline.at}
            afterAt={transfer.at}
            attempts={state.attempts.filter((a) => a.challengeId === CHALLENGE_ID)}
            onRedoTransfer={() => {
              setFormKey((k) => k + 1);
              go("transfer");
            }}
            onRedoBaseline={() => {
              setFormKey((k) => k + 1);
              go("baseline");
            }}
          />
        )}
      </div>
    </Container>
  );
}

function Lesson({ onDone, alreadyDone }: { onDone: () => void; alreadyDone: boolean }) {
  const [answer, setAnswer] = useState<string>();
  const chosen = CS_LESSON.quickCheck.options.find((o) => o.id === answer);
  return (
    <article className="mx-auto max-w-3xl">
      <Card className="p-6 sm:p-8">
        <Badge tone="lavender">Micro-lesson · about {CS_LESSON.minutes} min</Badge>
        <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{CS_LESSON.title}</h2>
        <div className="mt-6 space-y-7">
          {CS_LESSON.sections.map((s) => (
            <section key={s.id}>
              <h3 className="font-display text-lg font-bold">{s.title}</h3>
              {s.body.map((p) => (
                <p key={p} className="mt-2 leading-relaxed text-muted">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-3 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[15px] leading-relaxed">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lavender" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <fieldset className="mt-8 rounded-2xl border border-line bg-black/20 p-5">
          <legend className="px-1 text-sm font-semibold text-lavender">Quick check</legend>
          <p className="font-semibold">{CS_LESSON.quickCheck.question}</p>
          <div className="mt-3 grid gap-2">
            {CS_LESSON.quickCheck.options.map((o) => (
              <Radio key={o.id} name="qc" checked={answer === o.id} onChange={() => setAnswer(o.id)} label={o.label} />
            ))}
          </div>
          {chosen && (
            <p role="status" className={cn("mt-3 text-sm font-medium", chosen.correct ? "text-mint" : "text-amber")}>
              {chosen.correct ? "Correct. " : "Not quite. "}
              {chosen.explanation}
            </p>
          )}
        </fieldset>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-faint">Next: a new portfolio you haven&apos;t seen, solved on your own.</p>
          <Button
            size="lg"
            disabled={!chosen?.correct && !alreadyDone}
            onClick={() => {
              if (!alreadyDone) completeLesson(CS_LESSON.id);
              onDone();
            }}
          >
            {chosen?.correct || alreadyDone ? "Start the new challenge" : "Answer the quick check to continue"} <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </Card>
    </article>
  );
}

function Delta({ value }: { value: number }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", value > 0 ? "text-mint" : value < 0 ? "text-coral" : "text-muted")}>
      <Icon className="size-4" aria-hidden />
      {value > 0 ? "+" : ""}
      {Math.round(value * 10) / 10}
    </span>
  );
}

function Comparison({
  before,
  after,
  beforeAt,
  afterAt,
  attempts,
  onRedoTransfer,
  onRedoBaseline,
}: {
  before: PortfolioScoreResult;
  after: PortfolioScoreResult;
  beforeAt: number;
  afterAt: number;
  attempts: ChallengeAttempt[];
  onRedoTransfer: () => void;
  onRedoBaseline: () => void;
}) {
  const state = useAppState();
  const [copied, setCopied] = useState(false);
  const delta = after.total - before.total;
  const weakest = [...after.dimensions].sort((a, b) => a.points / a.max - b.points / b.max)[0];
  const sprintAccess = hasAccess(state, "plus");
  const week = currentPlanWeek(state);
  const unlockAt = nextWeekUnlockAt(state);

  const headline =
    delta > 0
      ? `Your score rose by ${delta} points on a portfolio you hadn't seen before.`
      : delta === 0
        ? "Same score on a new portfolio. The skill held, but it didn't grow yet."
        : `Your score dropped by ${Math.abs(delta)} points on the new portfolio.`;
  const followUp =
    delta > 0
      ? "That's evidence you applied the method on your own, not that you memorized one answer."
      : `That's useful information, not a failure. Your weakest area this time was ${weakest.label.toLowerCase()}: ${weakest.feedback}`;

  const skills = Object.entries(after.skillEvidence) as [SkillId, number][];
  const summary = [
    "PIVOTREADY Career Proof (training exercise, not a qualification)",
    `Customer Support → Customer Success challenge`,
    `Before: ${before.total}/100 (${formatDate(beforeAt)}) · After, on a new portfolio: ${after.total}/100 (${formatDate(afterAt)})`,
    `Skills practiced: ${skills.map(([s]) => SKILL_BY_ID[s].name).join(", ")}`,
  ].join("\n");

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="angled-bands pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative">
          <Badge tone={delta > 0 ? "mint" : delta === 0 ? "lavender" : "amber"}>Before → After</Badge>
          <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{headline}</h2>
          <p className="mt-2 max-w-3xl text-muted">{followUp}</p>
          <div className="mt-8 grid items-center gap-6 sm:grid-cols-[auto_auto_1fr]">
            <div className="text-center">
              <ScoreRing value={before.total} label="before" />
              <p className="mt-2 text-xs text-faint">{SCENARIO_BASELINE.title}</p>
            </div>
            <ArrowRight className="mx-auto hidden size-6 text-faint sm:block" aria-hidden />
            <div className="flex items-center gap-6">
              <div className="text-center">
                <ScoreRing value={after.total} label="after" />
                <p className="mt-2 text-xs text-faint">{SCENARIO_TRANSFER.title}</p>
              </div>
              <div className="font-display text-3xl">
                <Delta value={delta} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <h3 className="font-display text-lg font-bold">By rubric dimension</h3>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs text-faint">
              <tr>
                <th className="pb-2 font-semibold">Dimension</th>
                <th className="pb-2 font-semibold">Before</th>
                <th className="pb-2 font-semibold">After</th>
                <th className="pb-2 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              {after.dimensions.map((d) => {
                const b = before.dimensions.find((x) => x.id === d.id)!;
                return (
                  <tr key={d.id} className="border-t border-line">
                    <td className="py-2.5 pr-2 font-medium">{d.label}</td>
                    <td className="py-2.5 text-muted">
                      {b.points}/{b.max}
                    </td>
                    <td className="py-2.5">
                      {d.points}/{d.max}
                    </td>
                    <td className="py-2.5">
                      <Delta value={d.points - b.points} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <details className="mt-5 rounded-xl bg-black/20 p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Detailed feedback on your new decision</summary>
            <ul className="mt-3 space-y-3 text-muted">
              {after.dimensions.map((d) => (
                <li key={d.id}>
                  <span className="font-semibold text-soft">{d.label}: </span>
                  {d.feedback}
                </li>
              ))}
            </ul>
          </details>
          <div className="no-print mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onRedoTransfer}>
              <RotateCcw className="size-3.5" aria-hidden /> Redo the new challenge
            </Button>
            <Button variant="ghost" size="sm" onClick={onRedoBaseline}>
              Redo baseline
            </Button>
          </div>
        </Card>

        {/* Career Proof */}
        <Card className="border-mint/30">
          <Badge tone="mint">Career Proof</Badge>
          <h3 className="mt-3 font-display text-lg font-bold">What you can show for this</h3>
          <p className="mt-3 text-sm font-semibold text-soft">Skills practiced (demonstrated share in latest attempt)</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {skills.map(([s, v]) => (
              <li key={s} className="flex justify-between gap-2">
                <span>{SKILL_BY_ID[s].name}</span>
                <span className="text-muted">{Math.round(v * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-soft">Evidence of work</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {attempts
              .slice()
              .sort((a, b) => a.at - b.at)
              .map((a) => (
                <li key={a.id}>
                  <Check className="mr-1 inline size-3.5 text-mint" aria-hidden />
                  {a.stage === "baseline" ? "Baseline" : "New portfolio"}: {a.total}/100 · {formatDateTime(a.at)}
                </li>
              ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              navigator.clipboard?.writeText(summary).then(() => setCopied(true), () => setCopied(false));
            }}
          >
            <ClipboardCopy className="size-3.5" aria-hidden /> {copied ? "Copied" : "Copy a shareable summary"}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            A training exercise, not an accredited certificate or an employment qualification.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-lavender">Next weekly challenge</p>
            <p className="font-display text-xl font-bold">Week 2 Skill Sprint: a third, harder portfolio</p>
            <p className="mt-1 text-sm text-muted">
              {!sprintAccess
                ? "Part of PIVOTREADY Plus ($9.99/month)."
                : week >= 2
                  ? "Open now."
                  : unlockAt
                    ? `Unlocks ${formatDate(unlockAt)}, one week into your plan.`
                    : "Unlocks in week 2 of your plan."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/challenge/cs-sprint" variant={sprintAccess && week >= 2 ? "primary" : "secondary"}>
              View Skill Sprint
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="ghost">
              Go to my plan
            </ButtonLink>
          </div>
        </div>
      </Card>
      <p className="text-center text-sm text-faint">
        <Link href="/method#rubric" className="underline underline-offset-2 hover:text-muted">
          How scoring works
        </Link>
      </p>
    </div>
  );
}
