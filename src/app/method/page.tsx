import type { Metadata } from "next";
import { Card, Container, Notice, SectionTitle } from "@/components/ui";
import { FIT_WEIGHTS } from "@/lib/engine/paths";
import { RUBRIC } from "@/lib/engine/portfolio";
import { PROVENANCE } from "@/lib/data/sources";
import { RADAR_AS_OF, RADAR_BY_PATH, RADAR_SIGNALS, RADAR_VERSION } from "@/lib/data/radar";
import { AdaptationLoop } from "@/components/adaptation-loop";

const RADAR_SIGNAL_COUNT = Object.keys(RADAR_SIGNALS).length;
const RADAR_PER_PATH = (() => {
  const counts = Object.values(RADAR_BY_PATH).map((ids) => ids.length);
  return `${Math.min(...counts)}–${Math.max(...counts)}`;
})();
import { ROLES } from "@/lib/data/roles";
import { SKILLS } from "@/lib/data/skills";

export const metadata: Metadata = { title: "Method & limitations" };

function Code({ children }: { children: React.ReactNode }) {
  return <code className="block overflow-x-auto rounded-xl bg-black/30 p-3 text-[13px] leading-relaxed text-soft">{children}</code>;
}

export default function MethodPage() {
  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <SectionTitle
        as="h1"
        eyebrow="How it works"
        title="Method, data and limitations"
        description="PIVOTREADY runs on an explainable rule-based engine and a curated catalog. No paid AI is required, and no result is pre-written. Here is exactly how the numbers are made."
      />

      <div className="mt-10 space-y-6">
        <AdaptationLoop />
        <Card>
          <h2 className="font-display text-xl font-bold">1. Three kinds of skill evidence</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>
              <strong className="text-ink">Self-reported:</strong> your 0–4 confidence ratings. Unverified, and labeled that way.
            </li>
            <li>
              <strong className="text-ink">Inferred from tasks:</strong> each curated task exercises specific skills (primary = 2,
              secondary = 1). 5+ years of experience adds one level (max 3). Custom tasks are mapped by a published keyword list. Unrecognized
              text is left unclassified.
            </li>
            <li>
              <strong className="text-ink">Demonstrated:</strong> rubric scores from exercises you completed, converted to the 0–4 scale.
            </li>
          </ul>
          <Code>
            effective = 0.6·self + 0.4·inferred
            <br />
            effective (with exercise evidence) = 0.5·demonstrated + 0.3·self + 0.2·inferred
          </Code>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">2. Skill overlap, gaps and path fit</h2>
          <Code>
            overlap = Σ min(current, required)·importance ÷ Σ required·importance
            <br />
            gap = max(0, required − current)
            <br />
            fit = {FIT_WEIGHTS.overlap}·overlap + {FIT_WEIGHTS.goal}·goal + {FIT_WEIGHTS.concern}·concern + {FIT_WEIGHTS.feasibility}·feasibility − 0.05 (Reinvent, if you want to keep your income level)
          </Code>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Effort = Σ gap × planning hours per level (per skill) + extra preparation (Pivot: 10 h portfolio evidence; Reinvent: 40 h
            portfolio/credential prep), shown as a week range at your weekly time. Path fit is a planning aid. It is not a validated
            suitability score, and it is not a probability of being hired.
          </p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-soft">Role profiles used ({ROLES.length})</summary>
            <ul className="mt-3 space-y-3 text-muted">
              {ROLES.map((r) => (
                <li key={r.id}>
                  <strong className="text-ink">{r.title}:</strong>{" "}
                  {Object.entries(r.requirements)
                    .map(([s, req]) => `${SKILLS.find((x) => x.id === s)?.name} ${req!.level}/4 (importance ${req!.importance})`)
                    .join(" · ")}
                </li>
              ))}
            </ul>
          </details>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">3. 14-day plan generation</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your weekly time sets the number of sessions (3–6 per week) and their length. The first session is the path&apos;s practice
            challenge. Remaining sessions are split across your gap skills in proportion to gap × importance (largest-remainder
            rounding, top three gaps always covered), using authored modules in learn → practice → apply order. Days 7 and 14 are weekly
            reviews. Week 2 opens seven days after you start.
          </p>
        </Card>

        <Card id="rubric" className="scroll-mt-24">
          <h2 className="font-display text-xl font-bold">4. Customer Success challenge rubric</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The correct answers are not stored. They&apos;re derived from the account data by the same function for baseline, transfer
            and sprint portfolios, for sample and real users alike.
          </p>
          <Code>
            risk points = usage drop (≥30%: 3, ≥15%: 2, ≥5%: 1) + renewal (≤45d: 3, ≤90d: 2, ≤180d: 1) + champion left (3)
            <br />+ sentiment (negative: 2, mixed: 1) + seat use (&lt;50%: 2, &lt;70%: 1) + NPS ≤ 6 (1)
            <br />
            priority = risk points × √(ARR ÷ $10k)
          </Code>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <strong className="text-ink">Prioritization ({RUBRIC.prioritization}):</strong> your account&apos;s rank by priority. 1st = full,
              2nd = half, 3rd = 20%.
            </li>
            <li>
              <strong className="text-ink">Use of evidence ({RUBRIC.evidence}):</strong> signals true for your chosen account, minus half
              credit per unsupported or noise signal (ticket volume alone).
            </li>
            <li>
              <strong className="text-ink">Risk reasoning ({RUBRIC.risk}):</strong> your diagnosis vs. the risk derived from data (primary =
              full, secondary = half).
            </li>
            <li>
              <strong className="text-ink">Action & message ({RUBRIC.action + RUBRIC.message}):</strong> action fit for the root cause (
              {RUBRIC.action}) + a keyword heuristic on your message ({RUBRIC.message}): evidence, a concrete next step, the customer&apos;s goals,
              no pressure language. Messages under 12 words aren&apos;t scored. The heuristic is deliberately simple and is not a deep
              language evaluation.
            </li>
          </ul>
        </Card>

        <Card id="radar" className="scroll-mt-24">
          <h2 className="font-display text-xl font-bold">5. Career Radar</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The Career Radar on <strong className="text-ink">My plan</strong> shows {RADAR_SIGNAL_COUNT} curated signals ({RADAR_PER_PATH} per
            path) about how work around your chosen path is changing. Each signal has an as-of date, what&apos;s changing, what it means
            for your plan, the skill it relates to, and a link to practice it. We also show your own computed gap for that skill, from the
            same engine as your career map.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Signals are <strong className="text-ink">editorial statements</strong> written for catalog {RADAR_VERSION} (as of{" "}
            {RADAR_AS_OF}). They contain no statistics, percentages, salaries or forecasts, are not live labor-market data, and are not a
            job-loss forecast. Free users see one signal for their path; PIVOTREADY Plus shows all of them and gets them as the catalog is
            updated.
          </p>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">6. Data sources & provenance</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <strong className="text-ink">
              {PROVENANCE.catalog.label} {PROVENANCE.catalog.version} (as of {PROVENANCE.catalog.asOf}).
            </strong>{" "}
            {PROVENANCE.catalog.description}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We show no salary, job-growth or automation-probability numbers. We couldn&apos;t verify them against a dated source in this
            build, so we omit them rather than estimate. For official figures, see:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {PROVENANCE.furtherReading.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-lavender underline underline-offset-2 hover:text-soft">
                  {s.label}
                </a>
                <p className="text-xs text-faint">{s.note}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">7. Your data</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Guest mode stores your answers, plan, attempts and a small local activity log in your browser&apos;s localStorage (versioned,
            validated on load). Nothing is sent to a server, and no analytics service is connected. We never ask for your name, email,
            employer, salary or documents. Use “Reset my demo data” on the My plan page to delete everything.
          </p>
        </Card>

        <Notice tone="warning" title="Limitations">
          Role coverage is deepest for customer support → customer success. Custom roles get general preliminary guidance. Self-reported data
          is unverified. Task categories are editorial, not predictions of layoffs. Exercises are training, not employment qualifications or
          certificates. There is no live labor-market feed in this version.
        </Notice>
      </div>
    </Container>
  );
}
