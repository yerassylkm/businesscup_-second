"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/lib/storage/store";

/**
 * Pages built from guest state (localStorage) render after hydration so the
 * first paint never shows the wrong (server-default) state.
 */
export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      fallback ?? (
        <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="size-4 animate-spin rounded-full border-2 border-lavender border-t-transparent" aria-hidden />
            Loading your saved progress…
          </div>
        </div>
      )
    );
  }
  return <>{children}</>;
}
