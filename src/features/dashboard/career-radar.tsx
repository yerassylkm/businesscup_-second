"use client";

import Link from "next/link";
import { ArrowRight, Lock, Radar } from "lucide-react";
import { Badge, ButtonLink, Card, SectionTitle } from "@/components/ui";
import { PaywallCard } from "@/features/billing/paywall";
import { RADAR_AS_OF, RADAR_VERSION } from "@/lib/data/radar";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { SKILL_BY_ID } from "@/lib/data/skills";
import type { PathEvaluation } from "@/lib/engine/paths";
import { buildRadar, type RadarItem } from "@/lib/engine/radar";
import { hasAccess } from "@/lib/storage/actions";
import type { AppState } from "@/lib/storage/schema";
import { formatDate } from "@/lib/utils";
import type { PathId } from "@/types";

export function CareerRadar({ state, pathId, evaluation }: { state: AppState; pathId: PathId; evaluation: PathEvaluation }) {
  const required = Object.keys(ROLE_BY_ID[evaluation.roleId].requirements);
  const items = buildRadar(pathId, evaluation, required);
  const plus = hasAccess(state, "plus");
  const visible = items.filter((i) => i.access === "free" || plus);
  const locked = items.filter((i) => i.access === "plus" && !plus);

  return (
    <section id="radar" className="mt-12 scroll-mt-24" aria-labelledby="radar-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          eyebrow="Career Radar"
          title={<span id="radar-title">What&apos;s changing around your path</span>}
          description={`${items.length} curated signals for ${evaluation.roleTitle}, each linked to a skill in your plan and a way to practice it.`}
        />
        <Badge tone={plus ? "lavender" : "muted"}>
          <Radar className="size-3.5" aria-hidden /> {plus ? "Plus" : `Free: ${visible.length} of ${items.length}`}
        </Badge>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-faint">
        Curated snapshot · catalog {RADAR_VERSION} · as of {formatDate(new Date(`${RADAR_AS_OF}T12:00:00Z`).getTime())}. Editorial, not
        live labor-market data, not a job-loss forecast.{" "}
        <Link href="/method#radar" className="underline underline-offset-2 hover:text-muted">
          How the radar works
        </Link>
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <ul className={locked.length > 0 ? "grid gap-4" : "grid gap-4 lg:col-span-2 lg:grid-cols-2"}>
          {visible.map((item) => (
            <li key={item.id}>
              <RadarCard item={item} />
            </li>
          ))}
        </ul>

        {locked.length > 0 && (
          <div className="space-y-4">
            <Card>
            <p className="text-sm font-semibold text-soft">{locked.length} more signals for your path</p>
            <ul className="mt-3 space-y-2">
              {locked.map((i) => (
                <li key={i.id} className="flex items-center gap-2.5 rounded-xl bg-black/20 px-3 py-2.5 text-sm text-muted">
                  <Lock className="size-3.5 shrink-0 text-faint" aria-hidden />
                  <span className="min-w-0 flex-1">{i.title}</span>
                  <span className="sr-only">(locked, part of Plus)</span>
                </li>
              ))}
            </ul>
            </Card>
            <PaywallCard tier="plus" context="radar" />
          </div>
        )}
      </div>
    </section>
  );
}

function RadarCard({ item }: { item: RadarItem }) {
  const skill = SKILL_BY_ID[item.skill].name;
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="lavender">{skill}</Badge>
        <span className="text-xs text-faint">As of {formatDate(new Date(`${item.asOf}T12:00:00Z`).getTime())}</span>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold leading-snug">{item.title}</h3>
      <dl className="mt-3 flex-1 space-y-3 text-sm leading-relaxed">
        <div>
          <dt className="font-semibold text-soft">What&apos;s changing</dt>
          <dd className="text-muted">{item.whatsChanging}</dd>
        </div>
        <div>
          <dt className="font-semibold text-soft">What it means for your plan</dt>
          <dd className="text-muted">{item.whatItMeans}</dd>
        </div>
        <div>
          <dt className="sr-only">Your level</dt>
          <dd className="text-xs">
            {item.planLink.kind === "gap" ? (
              <span className="text-amber">
                Gap in your plan: {skill} {item.planLink.current.toFixed(1)} → {item.planLink.required}
              </span>
            ) : item.planLink.kind === "covered" ? (
              <span className="text-mint">You already meet this path&apos;s level for {skill.toLowerCase()}.</span>
            ) : (
              <span className="text-faint">Not a core skill for this path; useful context.</span>
            )}
          </dd>
        </div>
      </dl>
      <ButtonLink href={item.ctaHref} variant="secondary" size="sm" className="mt-4 self-start">
        {item.cta.label} <ArrowRight className="size-3.5" aria-hidden />
      </ButtonLink>
    </Card>
  );
}
