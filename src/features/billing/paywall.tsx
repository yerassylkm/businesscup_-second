"use client";

import { useEffect } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { setDemoPreview } from "@/lib/storage/actions";
import { track } from "@/lib/storage/store";
import { cn } from "@/lib/utils";

export const PLANS = {
  free: {
    name: "Free Career Check",
    price: "$0",
    cadence: "",
    features: [
      "2-minute assessment based on your real tasks",
      "Task Transformation Map",
      "Three paths with skill overlap, gaps and effort",
      "First practice challenge on every path, with before/after on Pivot",
      "Week 1 starter session and weekly reviews",
    ],
  },
  blueprint: {
    name: "Career Transition Blueprint",
    price: "$24.99",
    cadence: "one-time",
    features: [
      "Full personalized 14-day roadmap (every session unlocked)",
      "Deep skill-gap map for your chosen path",
      "Savable / printable Blueprint report (PDF via your browser)",
      "Recommended next exercises",
    ],
  },
  plus: {
    name: "PIVOTREADY Plus",
    price: "$9.99",
    cadence: "per month",
    features: [
      "Everything in the Blueprint (no separate purchase needed)",
      "Weekly Skill Sprints: new simulations each week",
      "Ongoing saved progress and skill evidence",
      "Skills Snapshot updates as the catalog is revised",
    ],
  },
} as const;

/** Inline paywall shown where locked content is requested. */
export function PaywallCard({ tier, context, className }: { tier: "blueprint" | "plus"; context: string; className?: string }) {
  useEffect(() => {
    track("paywall_viewed", { tier, context });
  }, [tier, context]);
  const plan = PLANS[tier];
  return (
    <div className={cn("rounded-2xl border border-lavender/30 bg-brand/10 p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/30">
          <Lock className="size-4 text-soft" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            Included in {plan.name}: {plan.price}
            {plan.cadence && <span className="font-normal text-muted"> {plan.cadence}</span>}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {plan.features.slice(0, 3).map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/pricing" size="sm" variant="secondary">
              Compare plans
            </ButtonLink>
            <Button size="sm" variant="outline" onClick={() => setDemoPreview(true)}>
              <Sparkles className="size-3.5" aria-hidden /> Preview full program (judge demo)
            </Button>
          </div>
          <p className="mt-2 text-xs text-faint">
            Checkout isn&apos;t connected in this build, so no payment can be taken. The demo preview unlocks content for review and is
            clearly labeled.
          </p>
        </div>
      </div>
    </div>
  );
}
