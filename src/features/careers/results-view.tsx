"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Pencil, Printer } from "lucide-react";
import { PATH_STYLE, PathGlyph } from "@/components/brand";
import { Badge, Button, ButtonLink, Card, Container, Notice, ProgressBar, SectionTitle } from "@/components/ui";
import { PATH_BY_ID, PATHS } from "@/lib/data/paths";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { SKILL_BY_ID, SKILLS } from "@/lib/data/skills";
import { PROVENANCE } from "@/lib/data/sources";
import { CATEGORY_META } from "@/lib/data/tasks";
import type { PathEvaluation } from "@/lib/engine/paths";
import { selectPath } from "@/lib/storage/actions";
import { useCareerResults, type CareerResults } from "@/lib/storage/derived";
import { useAppState } from "@/lib/storage/store";
import { cn, pct } from "@/lib/utils";
import type { PathId, SkillId, TaskCategory } from "@/types";
import { NoAssessment } from "./no-assessment";

const EXPERIENCE_TEXT = { lt2: "less than 2 years", "2to5": "2–5 years", "5to10": "5–10 years", "10plus": "10+ years" };
const TIME_TEXT = { "1to2": "1–2 hours", "3to5": "3–5 hours", "6to8": "6–8 hours", "9plus": "9+ hours" };
const CONCERN_TEXT = {
  ai_changing_tasks: "AI and automation changing your daily tasks",
  skills_outdated: "skills getting outdated",
  adjacent_move: "moving into a related role",
  new_field: "exploring a different field",
};

export function ResultsView() {
  const state = useAppState();
  const results = useCareerResults(state);
  if (!results) return <NoAssessment />;
  return <Results results={results} selected={state.selectedPathId} />;
}

function Results({ results, selected }: { results: CareerResults; selected: PathId | null }) {
  const { assessment: a, evaluations, recommended, taskMap, profile } = results;
  const isCustom = a.roleChoice === "custom";
  const roleTitle = isCustom ? a.customRoleTitle : "Customer Support Specialist";
  const taskCount = a.taskIds.length + a.customTasks.length;
  const rec = evaluations.find((e) => e.pathId === recommended)!;
  const [focusPath, setFocusPath] = useState<PathId>(selected ?? recommended);
  const focusEval = evaluations.find((e) => e.pathId === focusPath)!;
  const hasDemonstrated = Object.values(profile).some((p) => p.demonstrated !== null);

  return (
    <Container className="py-10 sm:py-14">
      {/* Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="lavender">Your career map · free</Badge>
            {a.isSample && <Badge tone="amber">Sample inputs (fictional persona)</Badge>}
            {isCustom && <Badge tone="amber">General preliminary guidance</Badge>}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            {roleTitle}: here are your options
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            You&apos;ve worked in this kind of role for {EXPERIENCE_TEXT[a.experience]}, told us about {taskCount} tasks you do
            regularly, and your main concern is {CONCERN_TEXT[a.concern]}. You can invest about {TIME_TEXT[a.weeklyTime]} a
            week.
          </p>
        </div>
        <div className="no-print flex gap-2">
          <ButtonLink href="/assessment" variant="secondary" size="sm">
            <Pencil className="size-3.5" aria-hidden /> Edit answers
          </ButtonLink>
          <ButtonLink href="/report" variant="ghost" size="sm">
            <Printer className="size-3.5" aria-hidden /> Report
          </ButtonLink>
        </div>
      </div>

      {isCustom && (
        <Notice tone="warning" className="mt-6" title="Limited analysis for custom roles">
          We don&apos;t have a curated profile for “{a.customRoleTitle}”. Everything below is driven only by the tasks you selected
          and described, mapped through our customer-facing skills catalog. Treat it as general preliminary guidance. We show no
          role-specific market numbers.
        </Notice>
      )}

      {/* Recommendation highlight */}
      <Card className="mt-8 overflow-hidden border-lavender/40 p-0">
        <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="angled-bands pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="relative flex gap-4">
            <PathGlyph pathId={recommended} className="size-14" />
            <div>
              <p className="text-sm font-semibold text-lavender">Recommended for you</p>
              <p className="font-display text-2xl font-bold sm:text-3xl">
                {PATH_BY_ID[recommended].name}: {rec.roleTitle}
              </p>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Highest path fit ({pct(rec.fit)}) from your skill overlap ({pct(rec.overlap)}), stated goal, main concern and weekly
                time. This is a planning aid, not a prediction. You can pick any path below.
              </p>
            </div>
          </div>
          <a href="#paths" className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-soft hover:text-ink">
            Compare all three <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </Card>

      {/* Task transformation map */}
      <section className="mt-14" aria-labelledby="taskmap">
        <SectionTitle
          eyebrow="Task Transformation Map"
          title={<span id="taskmap">How your tasks are changing</span>}
          description="Each task you selected, sorted by how it tends to change as AI tools and self-service spread. This is about tasks, not a forecast of your job."
        />
        <TaskShareBar shares={taskMap.shares} />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {(["automation_exposed", "ai_augmented", "human_led"] as TaskCategory[]).map((cat) => {
            const entries = taskMap.entries.filter((e) => e.category === cat);
            return (
              <Card key={cat} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <Badge tone={cat === "automation_exposed" ? "coral" : cat === "ai_augmented" ? "lavender" : "mint"}>
                    {CATEGORY_META[cat].label}
                  </Badge>
                  <span className="text-sm text-faint">{entries.length}</span>
                </div>
                <p className="mt-3 text-sm text-muted">{CATEGORY_META[cat].description}</p>
                <ul className="mt-4 space-y-2.5">
                  {entries.length === 0 && <li className="text-sm text-faint">None of your tasks.</li>}
                  {entries.map((e) => (
                    <li key={e.label} className="rounded-xl bg-black/20 p-3">
                      <p className="text-sm font-medium">
                        {e.label} {e.source === "custom" && <span className="text-xs text-faint">(your words)</span>}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-faint">{e.changeSignal}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
        {taskMap.entries.some((e) => e.category === null) && (
          <p className="mt-3 text-sm text-faint">
            Not classified: {taskMap.entries.filter((e) => !e.category).map((e) => `“${e.label}”`).join(", ")}. No recognized keywords,
            so we left it out rather than guess.
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Source: {PROVENANCE.catalog.label} {PROVENANCE.catalog.version}, as of {PROVENANCE.catalog.asOf}. Editorial classification,
          not live labor-market data and not a probability of job loss.{" "}
          <Link href="/method" className="underline underline-offset-2 hover:text-muted">
            Method
          </Link>
        </p>
      </section>

      {/* Skills */}
      <section className="mt-14" aria-labelledby="skills">
        <SectionTitle
          eyebrow="Your skills"
          title={<span id="skills">What transfers, and what to build</span>}
          description="Three kinds of evidence, kept separate: what you told us, what your tasks imply, and what you've demonstrated in exercises."
        />
        <div className="no-print mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Compare against:</span>
          {PATHS.map((p) => (
            <button
              key={p.id}
              onClick={() => setFocusPath(p.id)}
              aria-pressed={focusPath === p.id}
              className={cn(
                "rounded-full border px-3 py-1.5 font-semibold transition-colors",
                focusPath === p.id ? "border-lavender/60 bg-brand/20 text-ink" : "border-line text-muted hover:text-soft",
              )}
            >
              {p.name}: {ROLE_BY_ID[p.targetRoleId].title.replace(" (exploratory)", "")}
            </button>
          ))}
        </div>
        <Card className="mt-4">
          <SkillLegend hasDemonstrated={hasDemonstrated} />
          <div className="mt-5 grid gap-x-10 gap-y-5 md:grid-cols-2">
            {SKILLS.map((s) => (
              <SkillRow key={s.id} skill={s.id} results={results} evaluation={focusEval} />
            ))}
          </div>
        </Card>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold text-mint">Transferable to {focusEval.roleTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {focusEval.transferable.length === 0 && <p className="text-sm text-faint">No core skills at the needed level yet.</p>}
              {focusEval.transferable.map((s) => (
                <Badge key={s} tone="mint">
                  {SKILL_BY_ID[s].name}
                </Badge>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-amber">Skills to develop</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {focusEval.gaps.length === 0 && <p className="text-sm text-faint">No gaps against this profile.</p>}
              {focusEval.gaps.map((g) => (
                <Badge key={g.skill} tone="amber">
                  {SKILL_BY_ID[g.skill].name} +{g.gap}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Paths */}
      <section id="paths" className="mt-14 scroll-mt-24" aria-labelledby="paths-title">
        <SectionTitle
          eyebrow="Three paths"
          title={<span id="paths-title">Choose where to focus first</span>}
          description="Every number here is computed from your answers. Selecting a path builds your personal 14-day plan, and you can switch any time."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {evaluations.map((ev) => (
            <PathCard key={ev.pathId} ev={ev} recommended={ev.pathId === recommended} selected={ev.pathId === selected} />
          ))}
        </div>
      </section>

      {/* Free vs paid */}
      <section className="mt-14 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <p className="font-display text-xl font-bold">Everything above is free</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your task map, skills comparison, three paths and the first practice challenge on any path cost nothing. The{" "}
            <strong className="text-ink">Career Transition Blueprint ($24.99 one-time)</strong> unlocks your full 14-day roadmap and a
            savable report. <strong className="text-ink">Plus ($9.99/month)</strong> adds weekly Skill Sprints.
          </p>
          <ButtonLink href="/pricing" variant="outline" size="sm" className="mt-4">
            See what&apos;s included
          </ButtonLink>
        </Card>
        <Notice title="Limitations, in plain words">
          Self-reported skills aren&apos;t verified. Path fit is a transparent planning formula, not a validated assessment or a
          hiring probability. Effort estimates are planning ranges. Coverage is deepest for customer support today.
        </Notice>
      </section>
    </Container>
  );
}

function TaskShareBar({ shares }: { shares: Record<TaskCategory, number> }) {
  const parts: { cat: TaskCategory; cls: string }[] = [
    { cat: "automation_exposed", cls: "bg-coral" },
    { cat: "ai_augmented", cls: "bg-lavender" },
    { cat: "human_led", cls: "bg-mint-strong" },
  ];
  return (
    <div className="mt-6">
      <div className="flex h-3 overflow-hidden rounded-full bg-white/5" role="img" aria-label="Share of your tasks per category">
        {parts.map((p) => (
          <div key={p.cat} className={p.cls} style={{ width: `${shares[p.cat] * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {parts.map((p) => (
          <span key={p.cat} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", p.cls)} /> {CATEGORY_META[p.cat].label} {pct(shares[p.cat])}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillLegend({ hasDemonstrated }: { hasDemonstrated: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full border-2 border-soft" /> Self-reported (unverified)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-5 rounded-full bg-lavender/60" /> Implied by your tasks
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rotate-45 bg-mint-strong" /> Demonstrated in exercises{!hasDemonstrated && " (none yet)"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-0.5 bg-amber" /> Required for the selected profile
      </span>
    </div>
  );
}

function SkillRow({ skill, results, evaluation }: { skill: SkillId; results: CareerResults; evaluation: PathEvaluation }) {
  const p = results.profile[skill];
  const req = ROLE_BY_ID[evaluation.roleId].requirements[skill];
  const at = (lvl: number) => `${(lvl / 4) * 100}%`;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{SKILL_BY_ID[skill].name}</span>
        <span className="text-xs text-faint">
          {req ? `needs ${req.level}/4 · ` : "not required · "}
          estimate {p.effective.toFixed(1)}
        </span>
      </div>
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.06]" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-lavender/60" style={{ width: at(p.inferred) }} />
        {req && <div className="absolute top-0 h-4 w-0.5 bg-amber" style={{ left: at(req.level) }} title={`Required: ${req.level}`} />}
        <div
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-soft bg-bg"
          style={{ left: at(p.self) }}
          title={`Self-reported: ${p.self}`}
        />
        {p.demonstrated !== null && (
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-mint-strong"
            style={{ left: at(p.demonstrated) }}
            title={`Demonstrated: ${p.demonstrated}`}
          />
        )}
      </div>
      <span className="sr-only">
        Self-reported {p.self} of 4, implied by tasks {p.inferred}, demonstrated {p.demonstrated ?? "none"}, required {req?.level ?? "none"}.
      </span>
    </div>
  );
}

function PathCard({ ev, recommended, selected }: { ev: PathEvaluation; recommended: boolean; selected: boolean }) {
  const router = useRouter();
  const path = PATH_BY_ID[ev.pathId];
  const style = PATH_STYLE[ev.pathId];
  const [why, setWhy] = useState(false);

  function choose() {
    selectPath(ev.pathId);
    router.push(`/path/${ev.pathId}`);
  }

  return (
    <Card className={cn("flex flex-col transition-shadow", (recommended || selected) && "ring-1", selected ? "ring-mint/50" : recommended && style.ring)}>
      <div className="flex items-start justify-between gap-3">
        <PathGlyph pathId={ev.pathId} />
        <div className="flex flex-wrap justify-end gap-1.5">
          {recommended && <Badge tone="lavender">Recommended</Badge>}
          {selected && <Badge tone="mint">Your path</Badge>}
        </div>
      </div>
      <p className="mt-4 font-display text-2xl font-bold">{path.name}</p>
      <p className={cn("text-sm font-semibold", style.text)}>{ev.roleTitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{path.description}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-muted">Path fit (planning score)</span>
          <span className="font-bold">{pct(ev.fit)}</span>
        </div>
        <ProgressBar value={ev.fit} tone={recommended ? "brand" : "lavender"} label={`${path.name} path fit`} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-black/20 p-2.5">
          <dt className="text-[11px] text-muted">Skill overlap</dt>
          <dd className="font-display text-lg font-bold">{pct(ev.overlap)}</dd>
        </div>
        <div className="rounded-xl bg-black/20 p-2.5">
          <dt className="text-[11px] text-muted">Effort</dt>
          <dd className="font-display text-lg font-bold">{ev.effort}</dd>
        </div>
        <div className="rounded-xl bg-black/20 p-2.5">
          <dt className="text-[11px] text-muted">Est. weeks</dt>
          <dd className="font-display text-lg font-bold">
            {ev.weeksLow}–{ev.weeksHigh}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-faint">
        ≈{ev.skillHours} h skill practice{ev.extraPrepHours > 0 && ` + ${ev.extraPrepHours} h ${ev.pathId === "reinvent" ? "portfolio/credential prep" : "portfolio evidence"}`}
      </p>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-faint">Representative gaps</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {ev.gaps.slice(0, 3).map((g) => (
            <li key={g.skill} className="flex justify-between gap-2">
              <span>{SKILL_BY_ID[g.skill].name}</span>
              <span className="shrink-0 text-faint">
                {g.current.toFixed(1)} → {g.required}
              </span>
            </li>
          ))}
          {ev.gaps.length === 0 && <li className="text-faint">No gaps. Focus on stretch practice.</li>}
        </ul>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        <span className="font-semibold text-soft">Uncertainty: </span>
        {path.uncertainty}
      </p>
      {path.warning && <p className="mt-2 text-xs leading-relaxed text-amber/90">{path.warning}</p>}
      {ev.steppingStone && (
        <p className="mt-2 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-soft">Stepping stone: </span>
          {ev.steppingStone.roleTitle} ({pct(ev.steppingStone.overlap)} overlap) is a closer first move.
        </p>
      )}

      <button
        onClick={() => setWhy((w) => !w)}
        aria-expanded={why}
        className="no-print mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-lavender hover:text-soft"
      >
        Why this score? <ChevronDown className={cn("size-4 transition-transform", why && "rotate-180")} aria-hidden />
      </button>
      {why && (
        <ul className="mt-3 space-y-2 rounded-xl bg-black/20 p-3 text-xs">
          {ev.factors.map((f) => (
            <li key={f.id}>
              <div className="flex justify-between font-semibold text-soft">
                <span>{f.label}</span>
                <span>
                  {f.contribution >= 0 ? "+" : "−"}
                  {Math.abs(f.contribution * 100).toFixed(1)} pts
                </span>
              </div>
              <p className="text-faint">{f.explanation}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-6">
        <Button onClick={choose} variant={recommended || selected ? "primary" : "secondary"} className="w-full">
          {selected ? "Open my plan" : `Choose ${path.name}`} <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </Card>
  );
}
