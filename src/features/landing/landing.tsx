"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, PlayCircle } from "lucide-react";
import { PATH_STYLE, PathGlyph } from "@/components/brand";
import { Badge, Button, ButtonLink, ProgressBar } from "@/components/ui";
import { PATHS } from "@/lib/data/paths";
import { SAMPLE_ASSESSMENT } from "@/lib/data/presets";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { evaluateAllPaths } from "@/lib/engine/paths";
import { computeSkillProfile } from "@/lib/engine/profile";
import { saveAssessment } from "@/lib/storage/actions";
import { track } from "@/lib/storage/store";
import { cn } from "@/lib/utils";
import type { PathId } from "@/types";

export function LandingCtas() {
  const router = useRouter();
  useEffect(() => {
    track("landing_view");
  }, []);

  function startSample() {
    // The sample is only an input preset: it is saved like any answers and the
    // results page computes everything from it with the same engine.
    track("assessment_started", { sample: true });
    saveAssessment(SAMPLE_ASSESSMENT);
    router.push("/results");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ButtonLink href="/assessment" size="lg">
        Explore my career options <ArrowRight className="size-4" aria-hidden />
      </ButtonLink>
      <Button variant="secondary" size="lg" onClick={startSample}>
        <PlayCircle className="size-4 text-lavender" aria-hidden /> Try a sample journey
      </Button>
    </div>
  );
}

/**
 * Interactive preview of the three paths. Numbers are computed live by the
 * real engine from the fictional sample persona's inputs.
 */
export function PathPreview() {
  const [active, setActive] = useState<PathId>("pivot");
  const { evaluations, recommended } = useMemo(() => {
    const profile = computeSkillProfile(SAMPLE_ASSESSMENT);
    return evaluateAllPaths(SAMPLE_ASSESSMENT, profile);
  }, []);
  const ev = evaluations.find((e) => e.pathId === active)!;
  const path = PATHS.find((p) => p.id === active)!;
  const style = PATH_STYLE[active];

  return (
    <div className="surface relative overflow-hidden rounded-[28px] p-5 shadow-[var(--shadow-glow)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">Live preview</p>
          <p className="text-sm text-muted">Sample: Customer Support Specialist, 3–5 h/week</p>
        </div>
        <Badge tone="muted">Fictional sample</Badge>
      </div>
      <div role="tablist" aria-label="Career paths" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-black/25 p-1.5">
        {PATHS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={active === p.id}
            aria-controls="path-preview-panel"
            onClick={() => setActive(p.id)}
            className={cn(
              "rounded-xl px-2 py-2.5 text-sm font-bold uppercase tracking-wider transition-all",
              active === p.id ? "bg-card-hover text-ink shadow-inner" : "text-faint hover:text-soft",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div id="path-preview-panel" role="tabpanel" className="mt-5 animate-rise" key={active}>
        <div className="flex items-start gap-3">
          <PathGlyph pathId={active} />
          <div className="min-w-0">
            <p className={cn("text-xs font-bold uppercase tracking-wider", style.text)}>{path.tagline}</p>
            <p className="font-display text-xl font-bold leading-tight">{ev.roleTitle}</p>
          </div>
          {recommended === active && (
            <Badge tone="mint" className="ml-auto shrink-0">
              Best fit
            </Badge>
          )}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-black/20 p-3">
            <p className="font-display text-2xl font-bold">{Math.round(ev.overlap * 100)}%</p>
            <p className="text-[11px] text-muted">skill overlap</p>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <p className="font-display text-2xl font-bold">
              {ev.weeksLow}–{ev.weeksHigh}
            </p>
            <p className="text-[11px] text-muted">weeks (est.)</p>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <p className="font-display text-2xl font-bold">{ev.effort}</p>
            <p className="text-[11px] text-muted">effort</p>
          </div>
        </div>
        <div className="mt-5 space-y-2.5">
          <p className="text-xs font-semibold text-muted">Biggest gaps to close</p>
          {ev.gaps.slice(0, 3).map((g) => (
            <div key={g.skill}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{SKILL_BY_ID[g.skill].name}</span>
                <span className="text-faint">
                  {g.current.toFixed(1)} → {g.required}
                </span>
              </div>
              <ProgressBar value={g.current / 4} tone="lavender" label={`${SKILL_BY_ID[g.skill].name} current level`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrustList() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
      {["Free career check", "No signup", "About 2 minutes", "Your data stays in your browser"].map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <Check className="size-4 text-mint" aria-hidden /> {t}
        </li>
      ))}
    </ul>
  );
}
