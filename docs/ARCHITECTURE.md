# Architecture

## Overview

shifto is a single Next.js application with **no backend and no database**. Every route is statically prerendered;
each page is a thin server component that renders a client feature. All personal state lives in the visitor's browser.

```
Browser
 ├─ Route (static HTML shell)
 ├─ Feature component (client)
 │    ├─ useAppState()  ← lib/storage/store.ts (useSyncExternalStore over localStorage)
 │    ├─ useCareerResults(state) → lib/engine/* (pure functions)
 │    └─ actions (saveAssessment, selectPath, recordAttempt, ...) → store → localStorage
 └─ Curated data (lib/data/*), bundled at build time
```

## Data (`src/lib/data`)

| File | Contents |
| --- | --- |
| `skills.ts` | 10 skills, 0–4 scale, planning hours per level (editorial estimate) |
| `tasks.ts` | 14 curated support tasks, each with a category (automation-exposed / AI-augmented / human-led), a plain-language change signal, and skill tags |
| `roles.ts` | 5 role profiles (current role, AI-augmented support, Customer Success, Support Ops Coordinator, Operations Analyst) with level + importance per skill |
| `paths.ts` | Adapt / Pivot / Reinvent: target role, stepping stone, extra prep hours, entry points, uncertainty, warnings |
| `modules.ts` | 30 authored plan modules (3 per skill: learn → practice → apply) |
| `scenarios.ts` | 3 fictional customer portfolios (baseline, transfer, sprint), signals, risk types, actions with fit per risk |
| `lessons.ts` | Customer Success micro-lesson + quick check |
| `exercises.ts` | Adapt (AI draft review) and Reinvent (ops volume) content |
| `sources.ts` | Catalog version/date and further-reading links. No external figures are displayed |
| `presets.ts` | Fictional sample persona inputs |

The correct answers to the portfolio challenges are **not stored**: they are derived from the account numbers by the scoring engine.

## Engine (`src/lib/engine`)

- **profile.ts**: three separate evidence types per skill: self-reported, inferred from tasks (primary 2 / secondary 1, +1 for 5+ years, max 3), demonstrated (latest exercise evidence × 4).
  `effective = 0.6·self + 0.4·inferred`, or `0.5·demonstrated + 0.3·self + 0.2·inferred` once measured.
- **customTasks.ts**: keyword rules map free-text tasks to skills and a category; no match → unclassified (no guessing).
- **paths.ts**: `overlap = Σ min(cur, req)·imp / Σ req·imp`; `gap = max(0, req − cur)`; effort = Σ gap × hours/level + extra prep; week range at the user's weekly hours (×0.8 – ×1.3).
  `fit = 0.5·overlap + 0.2·goal + 0.15·concern + 0.15·feasibility − 0.05 (Reinvent ∧ keep income)`; every factor is returned for the "Why this score?" UI.
- **plan.ts**: 14-day plan. Weekly time → sessions/week (3–6) and minutes. Day 1 = path challenge; Pivot's last session = Plus sprint; days 7/14 = reviews; remaining sessions allocated across gaps by weighted gap (largest remainder, top-3 coverage), modules interleaved learn → practice → apply. Access tags: free (challenge, reviews, first module of each week), journey (Skill Journey), plus.
- **portfolio.ts**: risk points from usage trend, renewal timing, sponsor change, sentiment, seat utilization and NPS; `priority = risk × √(ARR/10k)`. Rubric: prioritization 35 (rank), evidence 25 (true signals − ½ per unsupported/noise), risk 20 (primary/secondary), action 12 (fit to primary risk) + message 8 (documented keyword heuristic, ≥12 words).
- **radar.ts** (+ `lib/data/radar.ts`): Career Radar. Curated, dated editorial signals per path (no statistics; enforced by a unit test), each linked to a skill and a real page; `buildRadar` attaches the user's computed gap for that skill and free/Plus access (first signal free).
- **progress.ts**: "Your profile updated": recomputes the profile and path gaps without and with a given attempt (same engine), so the UI can show measured before → after and which gaps shrank or grew.
- **exercises.ts**: rubric scoring for the AI draft review and the ops volume analysis (hours = volume × minutes × standard share ÷ 60).

All engine functions are pure and unit-tested (`tests/`).

## Storage (`src/lib/storage`)

- `schema.ts`: Zod schema for the versioned guest state (`version: 1`): assessment (+ draft), selected path, generated plan snapshot, completed items + notes, attempts (answers + scores), lessons, demo day offset, demo preview flag, local events (capped at 300), last visit.
  `migrateState` handles missing/corrupt data, unknown future versions and a migration chain for later versions.
- `store.ts`: a single in-memory store persisted to `localStorage`, exposed through `useSyncExternalStore` (cross-tab sync via the `storage` event). If storage is blocked, it falls back to memory and the UI says so.
- Results are **recomputed from inputs on every render**; only the plan snapshot is stored (so completion state stays stable).

### Why localStorage (and when to add Supabase)

The hackathon rules allow anonymous local sessions, and a judge must complete the journey with zero credentials. localStorage keeps
the product fully functional with no infrastructure. A Postgres/Supabase adapter becomes worthwhile for cross-device sync,
optional accounts, aggregated analytics, authored content updates without redeploys, and real subscriptions. It is **not implemented** in this version.

## Retention mechanic

The plan clock starts when a path is selected. Week 2 items (and the Plus Skill Sprint) unlock 7 days later. The dashboard shows the unlock
date and a clearly labeled **Demo: advance to next week** control (shifts this device's plan clock by 7 days) so reviewers can see the return loop.

## Monetization in the product

Free → Skill Journey ($34.99 one-time: the full path for one skill, kept after purchase) → shifto Plus ($19.99/month: full plans on every path, weekly Skill Sprints, plan updates and the full Career Radar while subscribed). Plans live in `src/features/billing/plans.ts`. Paywalls appear where locked content is
requested. No payment provider is connected, so there is no checkout. A labeled **judge demo preview** unlocks paid content locally and never
claims a purchase happened. Stripe test mode would be the next step (server route for checkout sessions + webhook signature validation).

## Events

Local only (`state.events`): `landing_view`, `assessment_started`, `assessment_completed`, `path_selected`, `baseline_completed`,
`lesson_completed`, `transfer_completed`, `exercise_completed`, `plan_item_completed`, `paywall_viewed`, `demo_plus_preview`,
`demo_week_advanced`, `return_visit`. Nothing is uploaded; the log is visible on the dashboard.

## Known limitations

See README → *Honest limitations*. Main ones: curated single-domain coverage, self-reported inputs, editorial task categories,
keyword-heuristic message scoring, single-device guest storage, no live labor-market data, no payments.

## Future scaling

More occupations as data packs (roles/tasks/modules/scenarios) with expert review; before/after cycles for Adapt and Reinvent;
optional accounts + Supabase sync; Stripe subscriptions; dated, sourced market snapshots; optional LLM feedback on free-text answers
with strict JSON rubric output and deterministic fallback.
