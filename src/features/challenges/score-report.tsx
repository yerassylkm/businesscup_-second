"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Card, Notice, ProgressBar, ScoreRing } from "@/components/ui";
import type { PortfolioScoreResult } from "@/lib/engine/portfolio";
import { cn } from "@/lib/utils";
import type { DimensionScore, PortfolioScenario } from "@/types";

export function DimensionList({ dimensions }: { dimensions: Pick<DimensionScore, "id" | "label" | "points" | "max" | "feedback">[] }) {
  return (
    <ul className="space-y-4">
      {dimensions.map((d) => (
        <li key={d.id}>
          <div className="mb-1.5 flex justify-between gap-2 text-sm">
            <span className="font-semibold">{d.label}</span>
            <span className="text-muted">
              {d.points} / {d.max}
            </span>
          </div>
          <ProgressBar value={d.points / d.max} tone={d.points / d.max >= 0.75 ? "mint" : d.points / d.max >= 0.4 ? "lavender" : "coral"} label={d.label} />
          {d.feedback && <p className="mt-2 text-sm leading-relaxed text-muted">{d.feedback}</p>}
        </li>
      ))}
    </ul>
  );
}

export function ScoreReport({
  title,
  total,
  max,
  dimensions,
  portfolio,
}: {
  title: string;
  total: number;
  max: number;
  dimensions: DimensionScore[];
  portfolio?: { result: PortfolioScoreResult; scenario: PortfolioScenario };
}) {
  const [showRank, setShowRank] = useState(false);
  return (
    <Card className="animate-rise">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreRing value={total} max={max} />
        <div>
          <p className="text-sm font-semibold text-lavender">{title}</p>
          <p className="font-display text-2xl font-bold">
            {total >= 80 ? "Strong judgment" : total >= 55 ? "Solid start, with gaps" : total >= 30 ? "Partly there" : "A useful baseline"}
          </p>
          <p className="mt-1 text-sm text-muted">Scored by a fixed rubric from your answers. Change an answer and the score changes.</p>
        </div>
      </div>
      <div className="mt-6">
        <DimensionList dimensions={dimensions} />
      </div>
      {portfolio && (
        <>
          <div className="mt-6 rounded-xl bg-black/20 p-4">
            <p className="text-sm font-semibold">Message check (keyword heuristic)</p>
            <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
              {portfolio.result.messageChecks.map((c) => (
                <li key={c.id} className={cn("flex items-center gap-2", c.passed ? "text-mint" : "text-faint")}>
                  {c.passed ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />} {c.label}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setShowRank((s) => !s)}
            aria-expanded={showRank}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-lavender hover:text-soft"
          >
            How the data ranks these accounts <ChevronDown className={cn("size-4 transition-transform", showRank && "rotate-180")} aria-hidden />
          </button>
          {showRank && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-faint">
                  <tr>
                    <th className="py-1.5 pr-3 font-semibold">#</th>
                    <th className="py-1.5 pr-3 font-semibold">Account</th>
                    <th className="py-1.5 pr-3 font-semibold">Risk points</th>
                    <th className="py-1.5 font-semibold">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.result.ranking.map((r, i) => (
                    <tr key={r.accountId} className={cn("border-t border-line", i + 1 === portfolio.result.chosenRank && "text-lavender")}>
                      <td className="py-1.5 pr-3">{i + 1}</td>
                      <td className="py-1.5 pr-3">
                        {r.name} {i + 1 === portfolio.result.chosenRank && "(your pick)"}
                      </td>
                      <td className="py-1.5 pr-3">{r.risk}</td>
                      <td className="py-1.5">{r.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs leading-relaxed text-faint">
                Priority = risk points × √(ARR ÷ $10k). Risk points come from usage trend, renewal timing, sponsor change, sentiment, seat
                use and NPS. See the full rubric on the Method page.
              </p>
            </div>
          )}
        </>
      )}
      <Notice className="mt-6">This is a training exercise, not an employment qualification or a certified assessment.</Notice>
    </Card>
  );
}
