"use client";

import { useEffect } from "react";
import { setDemoPreview } from "@/lib/storage/actions";
import { getState, track, updateState, useAppState, useHydrated } from "@/lib/storage/store";

const RETURN_GAP_MS = 30 * 60 * 1000;

/** Records a local `return_visit` event when someone comes back after 30+ minutes. */
export function AppEffects() {
  useEffect(() => {
    const s = getState();
    const now = Date.now();
    if (s.lastVisitAt && now - s.lastVisitAt > RETURN_GAP_MS && s.assessment) {
      track("return_visit", { hoursAway: Math.round((now - s.lastVisitAt) / 3_600_000) });
    }
    updateState((st) => ({ ...st, lastVisitAt: now }));
  }, []);
  return null;
}

export function DemoPreviewBanner() {
  const state = useAppState();
  const hydrated = useHydrated();
  if (!hydrated || !state.demoPreview) return null;
  return (
    <div className="no-print border-b border-amber/30 bg-amber/10 text-amber">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
        <p>
          <span className="mr-2 rounded-md bg-amber/20 px-1.5 py-0.5 text-xs font-bold tracking-wider">DEMO PREVIEW</span>
          Paid features are unlocked for review. No purchase was made and no payment was taken.
        </p>
        <button onClick={() => setDemoPreview(false)} className="font-semibold underline underline-offset-4 hover:text-ink">
          End preview
        </button>
      </div>
    </div>
  );
}
