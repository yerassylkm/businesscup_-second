"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Button, Container } from "@/components/ui";
import { PaywallCard } from "@/features/billing/paywall";
import { PATH_BY_ID } from "@/lib/data/paths";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { CATALOG_DATE, CATALOG_VERSION } from "@/lib/data/sources";
import { CATEGORY_META } from "@/lib/data/tasks";
import type { PlanItem } from "@/lib/engine/plan";
import { hasAccess } from "@/lib/storage/actions";
import { useCareerResults } from "@/lib/storage/derived";
import { useAppState } from "@/lib/storage/store";
import { formatDate, pct } from "@/lib/utils";
import { NoAssessment } from "./no-assessment";

/** Blueprint report: a printable summary (Save as PDF from the browser). */
export function BlueprintReport() {
  const state = useAppState();
  const [generatedAt] = useState(() => Date.now());
  const results = useCareerResults(state);
  if (!results) return <NoAssessment />;
  if (!hasAccess(state, "blueprint")) {
    return (
      <Container className="py-14">
        <h1 className="font-display text-3xl font-bold">Your Blueprint report</h1>
        <p className="mt-2 max-w-2xl text-muted">
          A printable, savable summary of your career map, chosen path, skill gaps, 14-day plan and practice evidence.
        </p>
        <div className="mt-6 max-w-2xl">
          <PaywallCard tier="blueprint" context="report" />
        </div>
      </Container>
    );
  }

  const pathId = state.plan?.pathId ?? results.recommended;
  const ev = results.evaluations.find((e) => e.pathId === pathId)!;
  const items = (state.plan?.pathId === pathId ? state.plan.items : []) as PlanItem[];
  const a = results.assessment;

  return (
    <Container className="print-plain max-w-4xl py-10">
      <div className="no-print mb-6 flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Print / Save as PDF
        </Button>
      </div>
      <article className="space-y-8 rounded-3xl border border-line bg-card p-6 sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <Wordmark />
          <p className="text-sm text-muted">Career Transition Blueprint · {formatDate(generatedAt)}</p>
        </header>
        <section>
          <h1 className="font-display text-3xl font-bold">
            {a.roleChoice === "custom" ? a.customRoleTitle : "Customer Support Specialist"} → {ev.roleTitle}
          </h1>
          <p className="mt-2 text-muted">
            Path: {PATH_BY_ID[pathId].name} · Skill overlap {pct(ev.overlap)} · Effort {ev.effort} · Estimated {ev.weeksLow}–{ev.weeksHigh} weeks at
            your weekly time budget.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold">Your tasks</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {results.taskMap.entries.map((e) => (
              <li key={e.label}>
                {e.label}: <span className="text-muted">{e.category ? CATEGORY_META[e.category].label : "not classified"}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold">Skills to build</h2>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1">Skill</th>
                <th className="py-1">Current estimate</th>
                <th className="py-1">Needed</th>
                <th className="py-1">Gap</th>
              </tr>
            </thead>
            <tbody>
              {ev.gaps.map((g) => (
                <tr key={g.skill} className="border-t border-line">
                  <td className="py-1.5">{SKILL_BY_ID[g.skill].name}</td>
                  <td className="py-1.5">{g.current.toFixed(1)}</td>
                  <td className="py-1.5">{g.required}</td>
                  <td className="py-1.5">{g.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm text-muted">
            Already transferable: {ev.transferable.map((s) => SKILL_BY_ID[s].name).join(", ") || "none at the needed level yet"}.
          </p>
        </section>
        {items.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold">14-day plan</h2>
            <ol className="mt-2 space-y-1 text-sm">
              {items.map((i) => (
                <li key={i.id}>
                  Day {i.day}: {i.title} ({i.minutes} min){state.completedItems[i.id] ? " ✓" : ""}
                </li>
              ))}
            </ol>
          </section>
        )}
        {state.attempts.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold">Practice evidence</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {state.attempts.map((t) => (
                <li key={t.id}>
                  {t.challengeId} ({t.stage}): {t.total}/{t.max} · {formatDate(t.at)}
                </li>
              ))}
            </ul>
          </section>
        )}
        <footer className="border-t border-line pt-6 text-xs leading-relaxed text-muted">
          Self-reported skills are unverified. Path fit and effort are planning estimates from a transparent formula, not predictions of
          employment, income or layoff risk. Exercises are training, not qualifications. Catalog {CATALOG_VERSION}, {CATALOG_DATE}.
        </footer>
      </article>
    </Container>
  );
}
