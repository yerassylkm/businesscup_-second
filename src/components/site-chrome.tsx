"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { ButtonLink, Container } from "@/components/ui";
import { useAppState, useHydrated } from "@/lib/storage/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/results", label: "Career map", needsAssessment: true },
  { href: "/dashboard", label: "My plan", needsAssessment: true },
  { href: "/method", label: "How it works", needsAssessment: false },
  { href: "/pricing", label: "Pricing", needsAssessment: false },
];

export function SiteHeader() {
  const pathname = usePathname();
  const state = useAppState();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const hasAssessment = hydrated && Boolean(state.assessment);
  const links = NAV.filter((n) => !n.needsAssessment || hasAssessment);

  // Close the mobile menu after navigating.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset transient menu state on route change
    setOpen(false);
  }, [pathname]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="PIVOTREADY home" className="rounded-xl">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink",
                pathname.startsWith(l.href) && "bg-white/5 text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href={hasAssessment ? "/dashboard" : "/assessment"} size="sm" className="hidden sm:inline-flex">
            {hasAssessment ? "Continue my plan" : "Start free check"}
          </ButtonLink>
          <button
            className="inline-flex size-10 items-center justify-center rounded-xl text-muted hover:bg-white/5 hover:text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-bg-2 md:hidden">
          <Container className="flex flex-col py-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 text-[15px] font-medium text-soft hover:bg-white/5">
                {l.label}
              </Link>
            ))}
            <Link
              href={hasAssessment ? "/dashboard" : "/assessment"}
              className="rounded-xl px-3 py-3 text-[15px] font-semibold text-lavender hover:bg-white/5"
            >
              {hasAssessment ? "Continue my plan" : "Start free check"}
            </Link>
          </Container>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-line/70 bg-bg-2/60">
      <Container className="grid gap-8 py-10 text-sm text-muted md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-sm leading-relaxed">
            Career resilience for working adults in the US: understand how your tasks are changing, compare realistic paths, and
            practice the skills that move you forward.
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-faint">
            Guidance and practice only. Not a job guarantee, not a layoff prediction, and not an accredited qualification.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-ink">Product</p>
          <Link className="block hover:text-ink" href="/assessment">Free career check</Link>
          <Link className="block hover:text-ink" href="/pricing">Pricing</Link>
          <Link className="block hover:text-ink" href="/method">Method & limitations</Link>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-ink">Your data</p>
          <p className="text-xs leading-relaxed">
            Guest mode: your answers and progress are stored only in this browser (localStorage). No account, no server copy.
          </p>
          <Link className="block hover:text-ink" href="/dashboard#data">Reset my demo data</Link>
        </div>
      </Container>
    </footer>
  );
}
