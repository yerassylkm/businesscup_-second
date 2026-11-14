"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Button, ButtonLink, Card, Container } from "@/components/ui";
import { SCENARIO_BASELINE, SCENARIO_TRANSFER } from "@/lib/data/scenarios";
import { SKILL_BY_ID } from "@/lib/data/skills";
import { useAppState } from "@/lib/storage/store";
import { formatDate, formatDateTime } from "@/lib/utils";
import { buildCareerProof } from "./career-proof";
import { CopyShareTextButton } from "./share-button";

/** Printable Career Proof (use the browser's "Save as PDF" to download). */
export function CareerProofPage() {
  const state = useAppState();
  const proof = buildCareerProof(state.attempts);
  const [generatedAt] = useState(() => Date.now());

  if (!proof) {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-2xl font-bold">Your Career Proof isn&apos;t ready yet</h1>
          <p className="mt-3 text-muted">
            Complete the Pivot challenge (before → micro-lesson → after) to generate a printable summary of the skills you practiced and
            your measured scores.
          </p>
          <ButtonLink href="/challenge/cs-portfolio" className="mt-6">
            Go to the challenge
          </ButtonLink>
        </Card>
      </Container>
    );
  }

  const { before, after, baseline, transfer } = proof;
  return (
    <Container className="print-plain max-w-4xl py-10">
      <div className="no-print mb-6 flex flex-wrap items-start justify-end gap-3">
        <CopyShareTextButton text={proof.shareText} />
        <Button onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Print / Save as PDF
        </Button>
      </div>
      <article className="space-y-8 rounded-3xl border border-line bg-card p-6 sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <Wordmark />
          <p className="text-sm text-muted">Career Proof · generated {formatDate(generatedAt)}</p>
        </header>
        <section>
          <h1 className="font-display text-3xl font-bold">Customer Support → Customer Success practice challenge</h1>
          <p className="mt-2 text-muted">
            Prioritize a customer portfolio, cite evidence, diagnose the retention risk and plan the outreach. Scored by a fixed,
            published rubric.
          </p>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line p-5">
            <p className="text-sm text-muted">Before · {SCENARIO_BASELINE.title}</p>
            <p className="mt-1 font-display text-4xl font-bold">{before.total}/100</p>
            <p className="text-xs text-faint">{formatDateTime(baseline.at)}</p>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <p className="text-sm text-muted">After · {SCENARIO_TRANSFER.title} (not seen before)</p>
            <p className="mt-1 font-display text-4xl font-bold">{after.total}/100</p>
            <p className="text-xs text-faint">{formatDateTime(transfer.at)}</p>
          </div>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold">By rubric dimension</h2>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1">Dimension</th>
                <th className="py-1">Before</th>
                <th className="py-1">After</th>
              </tr>
            </thead>
            <tbody>
              {after.dimensions.map((d) => {
                const b = before.dimensions.find((x) => x.id === d.id)!;
                return (
                  <tr key={d.id} className="border-t border-line">
                    <td className="py-1.5">{d.label}</td>
                    <td className="py-1.5">
                      {b.points}/{b.max}
                    </td>
                    <td className="py-1.5">
                      {d.points}/{d.max}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold">Skills practiced</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {proof.skills.map((s) => (
              <li key={s.skill}>
                {SKILL_BY_ID[s.skill].name}: measured {(s.share * 4).toFixed(1)} / 4 in the latest attempt
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold">All attempts</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {proof.attempts.map((a) => (
              <li key={a.id}>
                {a.stage === "baseline" ? "Before (portfolio A)" : "After (portfolio B)"}: {a.total}/100 · {formatDateTime(a.at)}
              </li>
            ))}
          </ul>
        </section>
        <footer className="border-t border-line pt-6 text-xs leading-relaxed text-muted">
          A training exercise, not an accredited certificate or an employment qualification. Companies in the scenarios are fictional.
          Scores come from a deterministic rubric applied to the answers above. The written-message part is a simple keyword check.
        </footer>
      </article>
    </Container>
  );
}
