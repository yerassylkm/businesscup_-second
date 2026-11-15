"use client";

import { useEffect } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { setDemoPreview } from "@/lib/storage/actions";
import { track } from "@/lib/storage/store";
import { cn } from "@/lib/utils";
import { PLANS, type PaidTier } from "./plans";

export { PLANS };


/** Inline paywall shown where locked content is requested. */
export function PaywallCard({ tier, context, className }: { tier: PaidTier; context: string; className?: string }) {
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
        <div className="min-w-0 flex-1 break-words">
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
            <Button size="sm" variant="outline" className="h-auto min-h-9 whitespace-normal py-1.5 text-left" onClick={() => setDemoPreview(true)}>
              <Sparkles className="size-3.5 shrink-0" aria-hidden /> Preview full program (judge demo)
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
