"use client";

import { useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Container, Notice, SectionTitle } from "@/components/ui";
import { setDemoPreview } from "@/lib/storage/actions";
import { track, useAppState } from "@/lib/storage/store";
import { cn } from "@/lib/utils";
import { PLANS } from "./plans";

export function PricingView() {
  const state = useAppState();
  useEffect(() => {
    track("paywall_viewed", { context: "pricing_page" });
  }, []);
  const preview = state.demoPreview;
  const startHref = state.assessment ? "/results" : "/assessment";

  const tiers = [
    { id: "free", plan: PLANS.free, highlight: false },
    { id: "journey", plan: PLANS.journey, highlight: false },
    { id: "plus", plan: PLANS.plus, highlight: true },
  ] as const;

  return (
    <Container className="py-12 sm:py-16">
      <SectionTitle
        as="h1"
        eyebrow="Pricing"
        title="Clarity for free. A structured plan when you're ready."
        description="You pay for a clear, personal transition plan and practice that proves progress, not for a pile of courses. Prices are early hypotheses we're testing with US users."
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone={preview ? "amber" : "muted"}>{preview ? "Demo preview active: paid features unlocked, no purchase made" : "Your plan: Free"}</Badge>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {tiers.map(({ id, plan, highlight }) => (
          <Card
            key={id}
            className={cn("relative flex flex-col", highlight && "border-lavender/50 shadow-[var(--shadow-glow)]")}
          >
            {highlight && (
              <Badge tone="lavender" className="absolute -top-3 left-6">
                Best for ongoing growth
              </Badge>
            )}
            <p className="font-display text-lg font-bold">{plan.name}</p>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold">{plan.price}</span>
              {plan.cadence && <span className="text-sm text-muted">{plan.cadence}</span>}
            </p>
            <p className="mt-1 text-xs text-faint">{id === "free" ? "No card, no signup." : "Price hypothesis · USD"}</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden />
                  <span className="text-soft">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {id === "free" ? (
                <ButtonLink href={startHref} variant="secondary" className="w-full">
                  {state.assessment ? "Open my career map" : "Start free check"}
                </ButtonLink>
              ) : preview ? (
                <Button variant="secondary" className="w-full" disabled>
                  Unlocked in demo preview
                </Button>
              ) : (
                <Button variant={highlight ? "primary" : "secondary"} className="w-full" onClick={() => setDemoPreview(true)}>
                  <Sparkles className="size-4 shrink-0" aria-hidden /> Preview {id === "plus" ? "Plus" : "Skill Journey"} (judge demo)
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-amber/30">
          <Badge tone="amber">For hackathon reviewers</Badge>
          <p className="mt-3 font-display text-xl font-bold">Preview the full program without paying</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A payment provider isn&apos;t connected in this build, so there is no checkout and no card form, and nothing here can charge
            you. The demo preview unlocks Skill Journey and Plus content on this device for review. It is labeled everywhere and does
            not pretend a purchase happened.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {preview ? (
              <Button variant="secondary" onClick={() => setDemoPreview(false)}>
                End demo preview
              </Button>
            ) : (
              <Button onClick={() => setDemoPreview(true)}>
                <Sparkles className="size-4" aria-hidden /> Preview full program (judge demo)
              </Button>
            )}
            {state.plan && (
              <ButtonLink href={`/path/${state.plan.pathId}`} variant="ghost">
                Open my 14-day plan
              </ButtonLink>
            )}
          </div>
        </Card>
        <div className="space-y-4">
          <Notice title="Why both a one-time and a monthly option?">
            Skill Journey is for one focused move: buy it once and keep the module. Plus is for ongoing growth: new programs, weekly
            Skill Sprints, plan updates and the full Career Radar on every path, for as long as you subscribe.
          </Notice>
          <Notice title="What we won't do">
            No job guarantees, no fake urgency, no auto-enrollment. Your free career map stays free.
          </Notice>
        </div>
      </div>
    </Container>
  );
}
