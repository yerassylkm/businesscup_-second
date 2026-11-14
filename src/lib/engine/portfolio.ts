import { ACTION_BY_ID, RISK_OPTIONS, SIGNAL_OPTIONS } from "@/lib/data/scenarios";
import { clamp, formatUSD, round } from "@/lib/utils";
import type {
  Account,
  DimensionScore,
  PortfolioAnswer,
  PortfolioScenario,
  RiskType,
  ScoreResult,
  SignalId,
} from "@/types";

/**
 * Deterministic rubric for the Customer Success portfolio challenge.
 * Same function for baseline, transfer, sprint, sample users and real users.
 *
 * Rubric (100 points):
 *   Prioritization   35: rank of the chosen account by computed priority
 *                        (1st = 35, 2nd = 17, 3rd = 7, otherwise 0)
 *   Use of evidence  25: selected signals that are true for the chosen account
 *                        minus half a point per unsupported/noise signal
 *   Risk reasoning   20: diagnosed risk vs. the risk derived from the data
 *                        (primary = 20, secondary = 10)
 *   Action plan      20: action fit for the account's primary risk (12)
 *                        + message heuristic (8, see scoreMessage)
 */

export const RUBRIC = { prioritization: 35, evidence: 25, risk: 20, action: 12, message: 8 } as const;
const RANK_SHARE = [1, 0.5, 0.2];

/* ---------- Account analytics (derived from data, not stored answers) ---------- */

export function seatUtilization(a: Account) {
  return a.seatsLicensed === 0 ? 0 : a.seatsUsed / a.seatsLicensed;
}

/**
 * Risk points from five health signals:
 *   usage: drop ≥30% → 3, ≥15% → 2, ≥5% → 1
 *   renewal: ≤45 days → 3, ≤90 → 2, ≤180 → 1
 *   champion left → 3
 *   sentiment: negative → 2, mixed → 1
 *   seat utilization: <50% → 2, <70% → 1
 *   NPS detractor (≤6) → 1
 */
export function riskPoints(a: Account) {
  const drop = -a.usageChange30d;
  const util = seatUtilization(a);
  let pts = 0;
  pts += drop >= 30 ? 3 : drop >= 15 ? 2 : drop >= 5 ? 1 : 0;
  pts += a.renewalInDays <= 45 ? 3 : a.renewalInDays <= 90 ? 2 : a.renewalInDays <= 180 ? 1 : 0;
  pts += a.championLeft ? 3 : 0;
  pts += a.sentiment === "negative" ? 2 : a.sentiment === "mixed" ? 1 : 0;
  pts += util < 0.5 ? 2 : util < 0.7 ? 1 : 0;
  pts += a.lastNps !== null && a.lastNps <= 6 ? 1 : 0;
  return pts;
}

/** Priority = risk points × √(ARR / $10k): risk matters most, stakes scale it. */
export function priorityScore(a: Account) {
  return round(riskPoints(a) * Math.sqrt(a.arr / 10000), 2);
}

export function rankAccounts(scenario: PortfolioScenario) {
  return [...scenario.accounts]
    .map((a) => ({ account: a, priority: priorityScore(a), risk: riskPoints(a) }))
    .sort((x, y) => y.priority - x.priority);
}

export function primaryRisk(a: Account): RiskType {
  const drop = -a.usageChange30d;
  if (a.championLeft) return "relationship";
  if (drop >= 15 && (seatUtilization(a) < 0.7 || drop >= 30)) return "adoption";
  if (a.sentiment === "negative") return "service";
  if (a.expansionSignal) return "expansion";
  if (drop >= 15) return "adoption";
  return "routine_renewal";
}

export function secondaryRisks(a: Account): RiskType[] {
  const primary = primaryRisk(a);
  const out: RiskType[] = [];
  if (primary !== "adoption" && -a.usageChange30d >= 15) out.push("adoption");
  if (primary !== "service" && a.sentiment === "negative") out.push("service");
  return out;
}

/** Which evidence statements are actually true for this account. */
export function trueSignals(a: Account, scenario: PortfolioScenario): Set<SignalId> {
  const s = new Set<SignalId>();
  if (a.usageChange30d <= -15) s.add("usage_drop");
  if (a.renewalInDays <= 60) s.add("renewal_soon");
  if (a.championLeft) s.add("champion_left");
  if (a.sentiment === "negative") s.add("negative_sentiment");
  if (seatUtilization(a) < 0.6) s.add("low_seat_use");
  if (a.lastNps !== null && a.lastNps <= 6) s.add("detractor");
  const topTwoArr = [...scenario.accounts].sort((x, y) => y.arr - x.arr).slice(0, 2).map((x) => x.id);
  if (topTwoArr.includes(a.id)) s.add("high_arr");
  const maxTickets = Math.max(...scenario.accounts.map((x) => x.openTickets));
  if (a.openTickets === maxTickets && maxTickets > 0) s.add("ticket_volume");
  if (a.expansionSignal) s.add("expansion_interest");
  return s;
}

/** Signals that never justify retention priority on their own. */
const NOISE_SIGNALS: SignalId[] = ["ticket_volume"];
const NEUTRAL_SIGNALS: SignalId[] = ["expansion_interest"];

/* ---------- Message heuristic (documented, deliberately simple) ---------- */

const EVIDENCE_WORDS = ["usage", "login", "log-in", "logins", "adoption", "seats", "tickets", "renewal", "activity", "dropped", "drop", "decline", "noticed", "data", "using"];
const NEXT_STEP_WORDS = ["call", "meeting", "meet", "chat", "session", "review", "walkthrough", "walk-through", "calendar", "schedule", "book", "minutes", "this week", "next week", "tomorrow", "monday", "tuesday", "wednesday", "thursday", "friday"];
const GOAL_WORDS = ["goal", "goals", "outcome", "outcomes", "priorities", "priority", "success", "value", "objective", "plan", "workflow", "your team"];
const PRESSURE_WORDS = ["discount", "% off", "renew now", "sign today", "last chance", "urgent", "asap", "contract expires", "before it's too late", "price"];

export interface MessageCheck {
  id: "evidence" | "next_step" | "goals" | "no_pressure";
  label: string;
  passed: boolean;
}

export function scoreMessage(message: string): { points: number; checks: MessageCheck[]; tooShort: boolean } {
  const text = message.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 12) {
    return {
      points: 0,
      tooShort: true,
      checks: [
        { id: "evidence", label: "Cites specific evidence", passed: false },
        { id: "next_step", label: "Proposes a concrete next step", passed: false },
        { id: "goals", label: "Connects to the customer's goals", passed: false },
        { id: "no_pressure", label: "No discount-first or pressure language", passed: false },
      ],
    };
  }
  const has = (list: string[]) => list.some((w) => text.includes(w));
  const checks: MessageCheck[] = [
    { id: "evidence", label: "Cites specific evidence", passed: /\d/.test(text) || has(EVIDENCE_WORDS) },
    { id: "next_step", label: "Proposes a concrete next step", passed: has(NEXT_STEP_WORDS) },
    { id: "goals", label: "Connects to the customer's goals", passed: has(GOAL_WORDS) },
    { id: "no_pressure", label: "No discount-first or pressure language", passed: !has(PRESSURE_WORDS) },
  ];
  const points = checks.filter((c) => c.passed).length * (RUBRIC.message / 4);
  return { points, checks, tooShort: false };
}

/* ---------- Full scoring ---------- */

const riskLabel = (r: RiskType) => RISK_OPTIONS.find((o) => o.id === r)?.label ?? r;
const signalLabel = (s: SignalId) => SIGNAL_OPTIONS.find((o) => o.id === s)?.label ?? s;

export interface PortfolioScoreResult extends ScoreResult {
  ranking: { accountId: string; name: string; priority: number; risk: number }[];
  chosenRank: number;
  messageChecks: MessageCheck[];
}

export function scorePortfolio(scenario: PortfolioScenario, answer: PortfolioAnswer): PortfolioScoreResult {
  const ranked = rankAccounts(scenario);
  const chosen = scenario.accounts.find((a) => a.id === answer.accountId);
  if (!chosen) throw new Error(`Unknown account ${answer.accountId}`);
  const best = ranked[0].account;
  const rankIndex = ranked.findIndex((r) => r.account.id === chosen.id);

  // 1. Prioritization
  const prioShare = RANK_SHARE[rankIndex] ?? 0;
  const prioPoints = round(RUBRIC.prioritization * prioShare, 1);
  const prioFeedback =
    rankIndex === 0
      ? `Correct priority. ${chosen.name} combines ${riskPoints(chosen)} risk points with ${formatUSD(chosen.arr)} at stake. No other account carries that much risk-weighted value.`
      : `${chosen.name} ranks #${rankIndex + 1} of ${ranked.length} by risk-weighted value. ${best.name} should come first: ${describeRisk(best)}, with ${formatUSD(best.arr)} at stake.` +
        (chosen.openTickets === Math.max(...scenario.accounts.map((a) => a.openTickets)) && chosen.openTickets > 0
          ? " Many open tickets make an account loud, but volume alone isn't the strongest churn signal."
          : "") +
        (chosen.renewalInDays === Math.min(...scenario.accounts.map((a) => a.renewalInDays))
          ? " The soonest renewal isn't automatically the riskiest one."
          : "");

  // 2. Evidence
  const truth = trueSignals(chosen, scenario);
  const supported = answer.signals.filter((s) => truth.has(s) && !NOISE_SIGNALS.includes(s) && !NEUTRAL_SIGNALS.includes(s));
  const unsupported = answer.signals.filter((s) => !truth.has(s) || NOISE_SIGNALS.includes(s));
  const relevantTrueCount = [...truth].filter((s) => !NOISE_SIGNALS.includes(s) && !NEUTRAL_SIGNALS.includes(s)).length;
  const evidenceShare = clamp((supported.length - 0.5 * unsupported.length) / Math.max(1, Math.min(relevantTrueCount, 4)));
  const evidencePoints = round(RUBRIC.evidence * evidenceShare, 1);
  const missed = [...truth].filter(
    (s) => !answer.signals.includes(s) && !NOISE_SIGNALS.includes(s) && !NEUTRAL_SIGNALS.includes(s),
  );
  const evidenceFeedback =
    answer.signals.length === 0
      ? "You didn't cite any evidence. Decisions are stronger when you can point to the data."
      : [
          supported.length ? `Supported by the data: ${supported.map(signalLabel).join("; ")}.` : "",
          unsupported.length
            ? `Not supported or not a churn signal on its own: ${unsupported.map(signalLabel).join("; ")}.`
            : "",
          missed.length ? `You could also have cited: ${missed.map(signalLabel).join("; ")}.` : "",
        ]
          .filter(Boolean)
          .join(" ");

  // 3. Risk reasoning
  const primary = primaryRisk(chosen);
  const secondary = secondaryRisks(chosen);
  const riskPointsEarned = answer.risk === primary ? RUBRIC.risk : secondary.includes(answer.risk) ? RUBRIC.risk / 2 : 0;
  const riskFeedback =
    answer.risk === primary
      ? `Correct diagnosis for ${chosen.name}: ${riskLabel(primary)}.`
      : secondary.includes(answer.risk)
        ? `Partly right. ${riskLabel(answer.risk)} is present, but the main risk for ${chosen.name} is ${riskLabel(primary).toLowerCase()}.`
        : `The data for ${chosen.name} points to ${riskLabel(primary).toLowerCase()}, not ${riskLabel(answer.risk).toLowerCase()}.`;

  // 4. Action plan
  const action = ACTION_BY_ID[answer.actionId];
  const actionFit = action ? action.fit[primary] : 0;
  const actionPoints = round(RUBRIC.action * actionFit, 1);
  const msg = scoreMessage(answer.message);
  const actionTotal = round(actionPoints + msg.points, 1);
  const actionFeedback = [
    actionFit >= 1
      ? "Your action addresses the root cause."
      : actionFit >= 0.5
        ? "Your action helps, but doesn't target the main root cause directly."
        : answer.actionId === "discount"
          ? "A discount doesn't fix why the customer might leave, and it gives away revenue."
          : "Your action doesn't address this account's main risk.",
    msg.tooShort
      ? "Your message is too short to evaluate (12+ words)."
      : `Message check (keyword heuristic): ${msg.checks.filter((c) => c.passed).length}/4 passed.`,
  ].join(" ");

  const dimensions: DimensionScore[] = [
    { id: "prioritization", label: "Prioritization", points: prioPoints, max: RUBRIC.prioritization, feedback: prioFeedback },
    { id: "evidence", label: "Use of evidence", points: evidencePoints, max: RUBRIC.evidence, feedback: evidenceFeedback },
    { id: "risk", label: "Risk reasoning", points: riskPointsEarned, max: RUBRIC.risk, feedback: riskFeedback },
    { id: "action", label: "Action & communication", points: actionTotal, max: RUBRIC.action + RUBRIC.message, feedback: actionFeedback },
  ];

  const share = (id: DimensionScore["id"]) => {
    const d = dimensions.find((x) => x.id === id)!;
    return d.points / d.max;
  };

  return {
    total: round(dimensions.reduce((s, d) => s + d.points, 0), 0),
    max: 100,
    dimensions,
    skillEvidence: {
      prioritization: round(share("prioritization"), 2),
      customer_health_analysis: round((share("prioritization") + share("evidence")) / 2, 2),
      data_interpretation: round(share("evidence"), 2),
      churn_prevention: round((share("risk") + actionPoints / RUBRIC.action) / 2, 2),
      stakeholder_communication: round(share("action"), 2),
    },
    ranking: ranked.map((r) => ({ accountId: r.account.id, name: r.account.name, priority: r.priority, risk: r.risk })),
    chosenRank: rankIndex + 1,
    messageChecks: msg.checks,
  };
}

function describeRisk(a: Account) {
  const parts: string[] = [];
  if (a.usageChange30d <= -15) parts.push(`usage down ${Math.abs(a.usageChange30d)}%`);
  if (a.championLeft) parts.push("champion left");
  if (a.renewalInDays <= 90) parts.push(`renewal in ${a.renewalInDays} days`);
  if (a.sentiment === "negative") parts.push("negative sentiment");
  if (seatUtilization(a) < 0.6) parts.push(`${Math.round(seatUtilization(a) * 100)}% of seats active`);
  return parts.join(", ") || "several risk signals";
}
