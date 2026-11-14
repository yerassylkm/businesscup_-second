"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, X } from "lucide-react";
import { PathGlyph } from "@/components/brand";
import { Badge, Button, Card, Notice, ProgressBar } from "@/components/ui";
import { customTextProblem, validateAssessment } from "@/features/assessment/schema";
import { PATH_BY_ID } from "@/lib/data/paths";
import { SAMPLE_ASSESSMENT } from "@/lib/data/presets";
import { LEVEL_LABELS, SKILLS } from "@/lib/data/skills";
import { CATEGORY_META, TASKS } from "@/lib/data/tasks";
import { mapCustomTask } from "@/lib/engine/customTasks";
import { saveAssessment } from "@/lib/storage/actions";
import { getState, track, updateState } from "@/lib/storage/store";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { cn } from "@/lib/utils";
import type { AssessmentInput, SkillId } from "@/types";

type Draft = Omit<AssessmentInput, "experience" | "concern" | "goal" | "weeklyTime"> & {
  experience?: AssessmentInput["experience"];
  concern?: AssessmentInput["concern"];
  goal?: AssessmentInput["goal"];
  weeklyTime?: AssessmentInput["weeklyTime"];
};

const EMPTY: Draft = {
  roleChoice: "customer_support_specialist",
  customRoleTitle: "",
  taskIds: [],
  customTasks: [],
  selfSkills: Object.fromEntries(SKILLS.map((s) => [s.id, 1])) as Record<SkillId, number>,
};

const STEPS = ["Role", "Experience", "Tasks", "Concern", "Skills", "Goal", "Time"] as const;

const EXPERIENCE = [
  { id: "lt2", label: "Less than 2 years" },
  { id: "2to5", label: "2–5 years" },
  { id: "5to10", label: "5–10 years" },
  { id: "10plus", label: "10+ years" },
] as const;

const CONCERNS = [
  { id: "ai_changing_tasks", label: "AI and automation are changing my daily tasks" },
  { id: "skills_outdated", label: "My skills may be getting outdated" },
  { id: "adjacent_move", label: "I want to move into a related role" },
  { id: "new_field", label: "I want to explore a different field" },
] as const;

const GOALS = [
  { id: "adapt", label: "Adapt", hint: "Stay in my profession and upgrade how I work" },
  { id: "pivot", label: "Pivot", hint: "Move into a related role using what I already know" },
  { id: "reinvent", label: "Reinvent", hint: "Explore a bigger change, knowing it takes more prep" },
  { id: "help_me_choose", label: "Help me choose", hint: "Recommend a path based on my answers" },
] as const;

const TIME = [
  { id: "1to2", label: "1–2 hours / week" },
  { id: "3to5", label: "3–5 hours / week" },
  { id: "6to8", label: "6–8 hours / week" },
  { id: "9plus", label: "9+ hours / week" },
] as const;

const BUDGET = [
  { id: "none", label: "$0, free only" },
  { id: "under25", label: "Up to $25" },
  { id: "under50", label: "Up to $50" },
  { id: "over50", label: "More than $50" },
  { id: "unsure", label: "Not sure yet" },
] as const;

const INCOME = [
  { id: "keep_level", label: "Keep my income at least where it is" },
  { id: "open_to_dip", label: "Open to a temporary dip for the right move" },
  { id: "prefer_not", label: "Prefer not to say" },
] as const;

function loadDraft(): { step: number; values: Draft } {
  const s = getState();
  if (s.assessmentDraft) {
    const v = s.assessmentDraft.values as Partial<Draft>;
    return {
      step: Math.min(s.assessmentDraft.step, STEPS.length - 1),
      values: { ...EMPTY, ...v, selfSkills: { ...EMPTY.selfSkills, ...(v.selfSkills ?? {}) } },
    };
  }
  if (s.assessment) return { step: 0, values: { ...s.assessment, isSample: false } };
  return { step: 0, values: EMPTY };
}

export function AssessmentWizard() {
  const router = useRouter();
  const [initial] = useState(loadDraft);
  const [step, setStep] = useState(initial.step);
  const [values, setValues] = useState<Draft>(initial.values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const started = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Autosave the draft as the user goes.
  useEffect(() => {
    updateState((s) => ({ ...s, assessmentDraft: { step, values: values as unknown as Record<string, unknown> } }));
  }, [step, values]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    if (!started.current) {
      started.current = true;
      track("assessment_started", { sample: false });
    }
    setValues((v) => ({ ...v, [key]: value, isSample: false }));
    setErrors({});
  }

  function stepErrors(i: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (i === 0 && values.roleChoice === "custom") {
      const t = (values.customRoleTitle ?? "").trim();
      if (t.length < 3) e.customRoleTitle = "Please enter your job title, e.g. “Help Desk Technician”.";
      else if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(t) || !/[a-z]{2,}/i.test(t)) e.customRoleTitle = "That doesn't look like a job title.";
    }
    if (i === 1 && !values.experience) e.experience = "Choose one option.";
    if (i === 2 && values.taskIds.length + values.customTasks.length < 3)
      e.taskIds = "Pick at least 3 tasks you actually do in a typical week (custom tasks count).";
    if (i === 3 && !values.concern) e.concern = "Choose the one that fits best.";
    if (i === 5 && !values.goal) e.goal = "Choose a goal, or “Help me choose”.";
    if (i === 6 && !values.weeklyTime) e.weeklyTime = "Choose how much time you can realistically spend.";
    return e;
  }

  function next() {
    const e = stepErrors(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    const result = validateAssessment(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    saveAssessment(result.data);
    updateState((s) => ({ ...s, assessmentDraft: null }));
    router.push("/results");
  }

  function addCustomTask() {
    const problem = customTextProblem(customInput);
    if (problem) return setCustomError(problem);
    if (values.customTasks.length >= 3) return setCustomError("You can add up to 3 custom tasks.");
    set("customTasks", [...values.customTasks, customInput.trim()]);
    setCustomInput("");
    setCustomError(null);
  }

  function useSample() {
    track("assessment_started", { sample: true });
    saveAssessment(SAMPLE_ASSESSMENT);
    updateState((s) => ({ ...s, assessmentDraft: null }));
    router.push("/results");
  }

  const customPreview = customInput.trim().length >= 4 ? mapCustomTask(customInput) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-lavender">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
          <p className="text-xs text-faint">Answers are saved in this browser as you go.</p>
        </div>
        <button onClick={useSample} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <Sparkles className="size-4 text-lavender" aria-hidden /> Use sample answers instead
        </button>
      </div>
      <ProgressBar value={(step + 1) / STEPS.length} label="Assessment progress" />
      <ol className="mt-3 hidden grid-cols-7 gap-1 text-center text-[11px] text-faint sm:grid" aria-hidden>
        {STEPS.map((s, i) => (
          <li key={s} className={cn(i <= step && "text-soft")}>
            {s}
          </li>
        ))}
      </ol>

      <Card className="mt-8 animate-rise" key={step}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
          noValidate
        >
          {step === 0 && (
            <fieldset>
              <legend className="contents">
                <StepHeading ref={headingRef} title="What's your current role?" hint="Our deepest coverage today is customer support. Other roles get general preliminary guidance." />
              </legend>
              <div className="mt-6 grid gap-3">
                <Choice
                  name="role"
                  checked={values.roleChoice === "customer_support_specialist"}
                  onChange={() => set("roleChoice", "customer_support_specialist")}
                  label="Customer Support Specialist"
                  hint="Also: customer service rep, support agent, help desk, CX associate"
                />
                <Choice name="role" checked={values.roleChoice === "custom"} onChange={() => set("roleChoice", "custom")} label="Another role" hint="Type your job title" />
                {values.roleChoice === "custom" && (
                  <div>
                    <label htmlFor="customRole" className="text-sm font-semibold">
                      Your job title
                    </label>
                    <input
                      id="customRole"
                      value={values.customRoleTitle ?? ""}
                      onChange={(e) => set("customRoleTitle", e.target.value)}
                      maxLength={60}
                      placeholder="e.g. Help Desk Technician"
                      aria-invalid={Boolean(errors.customRoleTitle)}
                      aria-describedby="customRole-err"
                      className="input mt-1.5"
                    />
                    <FieldError id="customRole-err" message={errors.customRoleTitle} />
                    <p className="mt-2 text-xs text-faint">
                      We don&apos;t have role-specific data for custom roles. Your results will be driven by the tasks you select and
                      labeled as general preliminary guidance.
                    </p>
                  </div>
                )}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="contents">
                <StepHeading ref={headingRef} title="How long have you worked in this kind of role?" />
              </legend>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {EXPERIENCE.map((o) => (
                  <Choice key={o.id} name="exp" checked={values.experience === o.id} onChange={() => set("experience", o.id)} label={o.label} />
                ))}
              </div>
              <FieldError message={errors.experience} />
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="contents">
                <StepHeading
                  ref={headingRef}
                  title="Which tasks fill your typical week?"
                  hint="Select everything you do regularly (at least 3). This matters more than your job title."
                />
              </legend>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {TASKS.map((t) => {
                  const on = values.taskIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-sm transition-colors",
                        on ? "border-lavender/60 bg-brand/15" : "border-line bg-black/15 hover:border-line-strong",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => set("taskIds", on ? values.taskIds.filter((x) => x !== t.id) : [...values.taskIds, t.id])}
                      />
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                          on ? "border-lavender bg-lavender text-bg" : "border-line-strong",
                        )}
                        aria-hidden
                      >
                        {on && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span>{t.label}</span>
                    </label>
                  );
                })}
              </div>
              <FieldError message={errors.taskIds} />

              <div className="mt-6 rounded-2xl border border-dashed border-line-strong p-4">
                <label htmlFor="customTask" className="text-sm font-semibold">
                  Add a task in your own words <span className="font-normal text-faint">(optional, up to 3)</span>
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="customTask"
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value);
                      setCustomError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTask();
                      }
                    }}
                    maxLength={120}
                    placeholder="e.g. Build the weekly SLA report in Excel"
                    aria-invalid={Boolean(customError)}
                    aria-describedby="customTask-err customTask-preview"
                    className="input"
                  />
                  <Button type="button" variant="secondary" onClick={addCustomTask} aria-label="Add custom task">
                    <Plus className="size-4" aria-hidden /> Add
                  </Button>
                </div>
                <FieldError id="customTask-err" message={customError ?? undefined} />
                {customPreview && !customError && (
                  <p id="customTask-preview" className="mt-2 text-xs text-faint">
                    {customPreview.category
                      ? `We'd read this as ${CATEGORY_META[customPreview.category].label.toLowerCase()} work involving ${Object.keys(customPreview.skills)
                          .map((s) => SKILL_BY_ID[s as SkillId].name.toLowerCase())
                          .join(", ")}.`
                      : "No recognized keywords yet. We'll keep it but won't classify it."}
                  </p>
                )}
                {values.customTasks.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {values.customTasks.map((t) => (
                      <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-brand/20 py-1 pl-3 pr-1.5 text-sm">
                        {t}
                        <button
                          type="button"
                          onClick={() => set("customTasks", values.customTasks.filter((x) => x !== t))}
                          className="rounded-full p-1 hover:bg-white/10"
                          aria-label={`Remove ${t}`}
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset>
              <legend className="contents">
                <StepHeading ref={headingRef} title="What's your main concern right now?" />
              </legend>
              <div className="mt-6 grid gap-3">
                {CONCERNS.map((o) => (
                  <Choice key={o.id} name="concern" checked={values.concern === o.id} onChange={() => set("concern", o.id)} label={o.label} />
                ))}
              </div>
              <FieldError message={errors.concern} />
            </fieldset>
          )}

          {step === 4 && (
            <fieldset>
              <legend className="contents">
                <StepHeading
                  ref={headingRef}
                  title="How confident are you in these skills today?"
                  hint="Self-reported. We label it that way everywhere. Practice challenges add measured evidence later."
                />
              </legend>
              <div className="mt-6 space-y-4">
                {SKILLS.map((s) => (
                  <div key={s.id} role="radiogroup" aria-label={s.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="hidden text-xs text-faint sm:block">{s.description}</p>
                    </div>
                    <div className="grid grid-cols-5 gap-1 rounded-xl bg-black/25 p-1">
                      {LEVEL_LABELS.map((label, lvl) => {
                        const on = values.selfSkills[s.id] === lvl;
                        return (
                          <button
                            key={label}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => set("selfSkills", { ...values.selfSkills, [s.id]: lvl })}
                            className={cn(
                              "rounded-lg px-1 py-2 text-[11px] font-semibold transition-colors sm:text-xs",
                              on ? "bg-brand text-white" : "text-faint hover:bg-white/5 hover:text-soft",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {step === 5 && (
            <fieldset>
              <legend className="contents">
                <StepHeading ref={headingRef} title="Which direction interests you?" hint="We'll still show all three paths and explain our recommendation." />
              </legend>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <Choice
                    key={g.id}
                    name="goal"
                    checked={values.goal === g.id}
                    onChange={() => set("goal", g.id)}
                    label={g.label}
                    hint={g.hint}
                    icon={g.id !== "help_me_choose" ? <PathGlyph pathId={g.id} className="size-9" /> : undefined}
                  />
                ))}
              </div>
              <FieldError message={errors.goal} />
              {values.goal && values.goal !== "help_me_choose" && PATH_BY_ID[values.goal].warning && (
                <Notice tone="warning" className="mt-4">
                  {PATH_BY_ID[values.goal].warning}
                </Notice>
              )}
            </fieldset>
          )}

          {step === 6 && (
            <div>
              <StepHeading ref={headingRef} title="How much time can you invest?" hint="Your plan is sized to this. Be realistic, not aspirational." />
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-semibold">Weekly learning time</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TIME.map((o) => (
                    <Choice key={o.id} name="time" checked={values.weeklyTime === o.id} onChange={() => set("weeklyTime", o.id)} label={o.label} />
                  ))}
                </div>
                <FieldError message={errors.weeklyTime} />
              </fieldset>
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-semibold">
                  Monthly budget for career learning <span className="font-normal text-faint">(optional)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {BUDGET.map((o) => (
                    <Pill key={o.id} on={values.budget === o.id} onClick={() => set("budget", values.budget === o.id ? undefined : o.id)}>
                      {o.label}
                    </Pill>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-semibold">
                  Income preference <span className="font-normal text-faint">(optional, we never ask for salary numbers)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {INCOME.map((o) => (
                    <Pill
                      key={o.id}
                      on={values.incomePreference === o.id}
                      onClick={() => set("incomePreference", values.incomePreference === o.id ? undefined : o.id)}
                    >
                      {o.label}
                    </Pill>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {Object.keys(errors).length > 0 && step === STEPS.length - 1 && errors._ && <FieldError message={errors._} />}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
            <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
            <Button type="submit">
              {step === STEPS.length - 1 ? "See my career map" : "Continue"} <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </form>
      </Card>
      <p className="mt-4 text-center text-xs text-faint">
        We don&apos;t ask for your name, email, employer or salary.{" "}
        <Badge tone="muted" className="ml-1">
          Guest mode
        </Badge>
      </p>
    </div>
  );
}

function StepHeading({ title, hint, ref }: { title: string; hint?: string; ref: React.Ref<HTMLHeadingElement> }) {
  return (
    <div>
      <h1 ref={ref} tabIndex={-1} className="font-display text-2xl font-bold tracking-tight outline-none sm:text-3xl">
        {title}
      </h1>
      {hint && <p className="mt-2 text-sm leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

function Choice({
  name,
  checked,
  onChange,
  label,
  hint,
  icon,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lavender",
        checked ? "border-lavender/60 bg-brand/15" : "border-line bg-black/15 hover:border-line-strong",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      </span>
      <span
        className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", checked ? "border-lavender bg-lavender" : "border-line-strong")}
        aria-hidden
      >
        {checked && <span className="size-2 rounded-full bg-bg" />}
      </span>
    </label>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        on ? "border-lavender/60 bg-brand/20 text-ink" : "border-line text-muted hover:border-line-strong hover:text-soft",
      )}
    >
      {children}
    </button>
  );
}

function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return <span id={id} />;
  return (
    <p id={id} role="alert" className="mt-2 text-sm font-medium text-coral">
      {message}
    </p>
  );
}
