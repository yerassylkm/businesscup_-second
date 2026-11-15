# shifto

**Work is shifting. So can you.**

shifto is a B2C web app (Skills track) for US working adults aged 25–45, starting with customer support professionals. It shows
which of your **actual daily tasks** are shifting as AI and self-service spread, compares **three career paths** (Adapt, Pivot,
Reinvent) computed from your answers, and lets you **prove progress** on a realistic work simulation: baseline → micro-lesson →
a new, analogous task you solve on your own, with an honest before/after score.

No signup. Guest progress is saved in your browser.

## What works today

| Area | What's implemented |
| --- | --- |
| Landing `/` | Hero, live path preview computed by the engine, "Try a sample journey" (loads a fictional preset through the same engine), reviewer quick-start |
| Assessment `/assessment` | 7-step form: role (seeded or custom), experience, real daily tasks + up to 3 free-text tasks, concern, self-rated skills, goal, weekly time, optional budget/income preference. Zod validation, inline errors, autosaved draft |
| Career map `/results` | Task Transformation Map, skills shown as self-reported vs. task-inferred vs. demonstrated, three paths with fit, overlap, effort, week range, gaps, uncertainty and an itemized "Why this score?" |
| Roadmap `/path/[adapt\|pivot\|reinvent]` | Personal 14-day plan generated from weighted gaps + weekly time; switching paths changes gaps and modules; module steps, notes, completion; Skill Journey/Plus locks; week 2 time-gated |
| Flagship challenge `/challenge/cs-portfolio` | Customer Support → Customer Success: prioritize a 5-account portfolio, cite evidence, diagnose risk, choose an action, write the message → rubric score → 3-minute lesson + quick check → different portfolio → before/after comparison → Career Proof |
| Other exercises | `/challenge/ai-draft-review` (Adapt), `/challenge/ops-volume` (Reinvent) single scored skill checks; `/challenge/cs-sprint` week-2 Skill Sprint (Plus) |
| Dashboard `/dashboard` | Weekly mission, "Continue my plan", **Career Radar** (curated, dated editorial signals per path, linked to your gaps and to practice; 1 free, rest Plus), before/after results, Skills Snapshot, next skill, labeled **Demo: advance to next week**, local activity log, **Reset my demo data** |
| Loop after practice | "Your profile updated" on every result: measured skill before → after, the path gap that moved, and a deep link to the next plan session |
| Career Proof `/proof` | Printable before/after summary (Save as PDF) + "Copy share text" (neutral, states it's not a certificate) |
| Pricing `/pricing` | Free $0 · Skill Journey $34.99 one-time · shifto Plus $19.99/month (price hypotheses; an annual plan is a later test, not offered in the product). Inline paywalls. Labeled **Preview full program (judge demo)**. No payment provider is connected, so there is no fake checkout |
| Report `/report` | Skill Journey summary, printable / Save as PDF |
| Method `/method` | Formulas, rubric, provenance, data handling, limitations |

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Checks:

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest: scoring, path recommendation, plan generation, storage migration
npm run build      # production build
```

Node 20+ (developed on Node 22). **No environment variables are required** (see `.env.example`).

## How it's built

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zod · lucide-react · Vitest
- No backend and no database: every route is statically prerendered, and personal state lives in versioned `localStorage`.
- Explainable rule-based engine in `src/lib/engine` with curated seed data in `src/lib/data`. No LLM, no paid API.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for architecture, scoring, storage choice and limitations.

```
src/
  app/                 routes (thin server pages that render client features)
  components/          UI primitives, brand, header/footer
  features/            assessment, careers (results/roadmap/report), challenges, dashboard, billing, landing
  lib/data/            curated catalog: skills, tasks, roles, paths, modules, scenarios, lesson, sources, sample preset
  lib/engine/          profile, paths, plan, portfolio scoring, exercise scoring, custom-task mapping
  lib/storage/         versioned schema + migration, store (useSyncExternalStore), actions, derived results
tests/                 unit tests
```

## Honest limitations

- Curated coverage: the deep role is Customer Support → Customer Success. Custom roles get **general preliminary guidance** driven only by selected tasks.
- Skills are **self-reported** until you complete an exercise; demonstrated evidence is shown separately.
- Task categories and path fit are **editorial / formula-based planning aids**, not layoff predictions, hiring probabilities or validated assessments.
- No salary or job-growth numbers are shown: none could be verified against a dated source in this build, so they are omitted.
- The message check in the challenge is a **documented keyword heuristic**, not deep language understanding.
- Exercises are training, **not** accredited certificates or employment qualifications.
- Guest data lives on one device/browser. No cross-device sync, no accounts, no server analytics (events are local only).
- Payments: no checkout is connected. The judge demo preview unlocks paid content on the device and is labeled everywhere.

## Reviewer quick path (~5 minutes)

1. Open the site → **Try a sample journey** (the fictional sample is recommended **Pivot** by the engine) or answer with your own inputs.
2. Choose **Pivot** → **Start** the flagship challenge → baseline → lesson → new portfolio → compare → see **Your profile updated**.
3. Redo with different answers: scores change.
4. **My plan** → **Career Radar**, then **Demo: advance to next week** to see the weekly return loop.
5. **Pricing** → **Preview full program (judge demo)** → Skill Sprint, full plans, Career Radar and the Skill Journey report unlock.

## Browser walkthrough (optional)

`scripts/e2e-journey.cjs` drives the full journey with Playwright (sample → Pivot, custom inputs, challenge before/after,
profile update + next step, Career Proof print/copy, Career Radar on all three paths, retry with different answers, refresh
persistence, paywall, demo week advance, demo preview, mobile overflow checks, reset):

```bash
npm run build && npm start
BASE=http://localhost:3000 node scripts/e2e-journey.cjs
```
