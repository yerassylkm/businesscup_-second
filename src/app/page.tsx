import Link from "next/link";
import { ArrowRight, Check, ClipboardList, FlaskConical, Map, Repeat } from "lucide-react";
import { AdaptationLoop } from "@/components/adaptation-loop";
import { PathGlyph } from "@/components/brand";
import { Badge, ButtonLink, Card, Container, Eyebrow, SectionTitle } from "@/components/ui";
import { LandingCtas, PathPreview, TrustList } from "@/features/landing/landing";
import { PATHS } from "@/lib/data/paths";
import { CATEGORY_META, TASKS } from "@/lib/data/tasks";
import type { TaskCategory } from "@/types";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Map your real tasks",
    body: "Tell us what you actually do each week, not just your title. Each task is sorted by how it's changing with AI.",
  },
  {
    icon: Map,
    title: "Compare three paths",
    body: "Adapt in place, pivot next door, or reinvent. See skill overlap, gaps and effort computed from your answers.",
  },
  {
    icon: FlaskConical,
    title: "Practice on a real-world task",
    body: "Solve a realistic work scenario, learn in 3 minutes, then solve a new one on your own. See your honest before and after.",
  },
  {
    icon: Repeat,
    title: "Keep a weekly plan",
    body: "A 14-day plan sized to your time budget, saved progress, and a new mission each week.",
  },
];

const CATEGORY_ORDER: TaskCategory[] = ["automation_exposed", "ai_augmented", "human_led"];
const CATEGORY_TONE = { automation_exposed: "coral", ai_augmented: "lavender", human_led: "mint" } as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="angled-bands pointer-events-none absolute inset-0" aria-hidden />
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="animate-rise">
            <Badge tone="lavender" className="mb-6">
              For customer support professionals in the US
            </Badge>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Your career has options.{" "}
              <span className="text-gradient">Build them before you need them.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              AI is changing which tasks fill your workday. PIVOTREADY shows which of your tasks are shifting, which skills
              already transfer, and three practical moves you can make, then lets you practice the skill that matters
              most.
            </p>
            <div className="mt-8">
              <LandingCtas />
            </div>
            <div className="mt-6">
              <TrustList />
            </div>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <PathPreview />
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionTitle
            eyebrow="How it works"
            title="From “Will AI change my job?” to a plan you can act on this week"
            description="Four steps, about 30 minutes in total. The first career map takes about 2 minutes."
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Card className="h-full">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/20">
                      <s.icon className="size-5 text-lavender" aria-hidden />
                    </span>
                    <span className="font-display text-sm font-bold text-faint">0{i + 1}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </Card>
              </li>
            ))}
          </ol>
          <AdaptationLoop className="mt-6" />
        </Container>
      </section>

      {/* Task-level insight */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionTitle
            eyebrow="Tasks, not titles"
            title="Two people with the same job title can face very different changes"
            description="We look at the work you actually do. Here's how a few common support tasks are classified in our curated catalog. It's an editorial judgment, not a layoff forecast."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {CATEGORY_ORDER.map((cat) => (
              <Card key={cat}>
                <Badge tone={CATEGORY_TONE[cat]}>{CATEGORY_META[cat].label}</Badge>
                <p className="mt-3 text-sm leading-relaxed text-muted">{CATEGORY_META[cat].description}</p>
                <ul className="mt-4 space-y-2">
                  {TASKS.filter((t) => t.category === cat)
                    .slice(0, 3)
                    .map((t) => (
                      <li key={t.id} className="rounded-xl bg-black/20 px-3 py-2 text-sm">
                        {t.label}
                      </li>
                    ))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Three paths */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionTitle
            eyebrow="Three paths"
            title="You don't have to choose between “stay” and “start over”"
            description="Every career map shows all three. We recommend one based on your answers and explain why, and you can always pick a different one."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PATHS.map((p) => (
              <Card key={p.id} className="flex flex-col">
                <PathGlyph pathId={p.id} />
                <p className="mt-4 font-display text-2xl font-bold">{p.name}</p>
                <p className="text-sm font-semibold text-soft">{p.tagline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>
                {p.warning && <p className="mt-3 text-xs leading-relaxed text-amber/90">{p.warning}</p>}
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Before / after mechanic */}
      <section className="py-16 sm:py-20">
        <Container>
          <Card className="relative overflow-hidden p-6 sm:p-10">
            <div className="angled-bands pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <Eyebrow>Proof, not promises</Eyebrow>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Try it. Learn. Try a new one on your own.
                </h2>
                <p className="mt-4 leading-relaxed text-muted">
                  The flagship Pivot challenge puts you in a Customer Success seat: five customer accounts, real-looking
                  usage, renewal and sentiment data, one decision. We score it against a published rubric, teach the core
                  idea in about 3 minutes, then give you a different portfolio to solve on your own.
                </p>
                <p className="mt-3 leading-relaxed text-muted">
                  Your before and after scores come only from your answers. If you don&apos;t improve, we tell you that too.
                </p>
              </div>
              <ol className="space-y-3">
                {[
                  ["Before", "Prioritize a customer portfolio and plan the outreach"],
                  ["Learn", "Micro-lesson: health signals, root causes, follow-ups"],
                  ["After", "A new portfolio with different data, solved on your own"],
                  ["Career Proof", "Skills practiced, scores, and your next weekly challenge"],
                ].map(([k, v], i) => (
                  <li key={k} className="flex items-center gap-4 rounded-2xl bg-black/25 p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/25 font-display font-bold text-soft">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{k}</p>
                      <p className="text-sm text-muted">{v}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </Container>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionTitle
            eyebrow="Pricing"
            title="Start free. Pay only for the deeper plan."
            description="The career map, three paths and your first practice challenge are free. Prices below are early hypotheses we're testing."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { name: "Free Career Check", price: "$0", note: "Task map, three paths, first challenge" },
              { name: "Career Transition Blueprint", price: "$24.99", note: "One-time: full 14-day roadmap + savable report" },
              { name: "PIVOTREADY Plus", price: "$9.99/mo", note: "Blueprint included + weekly Skill Sprints" },
            ].map((t) => (
              <Card key={t.name}>
                <p className="text-sm font-semibold text-soft">{t.name}</p>
                <p className="mt-1 font-display text-3xl font-bold">{t.price}</p>
                <p className="mt-2 text-sm text-muted">{t.note}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 font-semibold text-lavender hover:text-soft">
              Compare plans <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Container>
      </section>

      {/* Honesty + judges */}
      <section className="py-16 sm:py-20">
        <Container className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-xl font-bold">What PIVOTREADY is not</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {[
                "Not a prediction of whether you'll lose your job.",
                "Not a guarantee of a new job, promotion or salary.",
                "Not a course marketplace or a resume builder.",
                "Not an accredited certificate. Exercises are training, not qualifications.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-lavender" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/method" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-lavender hover:text-soft">
              Read our method & limitations <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Card>
          <Card className="border-lavender/30">
            <Badge tone="amber">For hackathon reviewers</Badge>
            <h2 className="mt-3 font-display text-xl font-bold">Full journey in about 5 minutes, no signup</h2>
            <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-muted">
              <li>Click “Try a sample journey”, or answer the 2-minute check with your own inputs.</li>
              <li>On your career map, choose any path. Pivot has the full flagship challenge.</li>
              <li>Do the challenge: before → micro-lesson → after. Retry with different answers to see scores change.</li>
              <li>Open “My plan” and use “Demo: advance to next week” to see the weekly return loop.</li>
              <li>On Pricing, use “Preview full program (judge demo)”. No payment is taken.</li>
            </ol>
            <ButtonLink href="/assessment" variant="outline" size="sm" className="mt-5">
              Start with my own answers
            </ButtonLink>
          </Card>
        </Container>
      </section>
    </>
  );
}
