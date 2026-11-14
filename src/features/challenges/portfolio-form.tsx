"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { ACTION_OPTIONS, RISK_OPTIONS, SIGNAL_OPTIONS } from "@/lib/data/scenarios";
import { seatUtilization } from "@/lib/engine/portfolio";
import { cn, formatUSD } from "@/lib/utils";
import type { Account, PortfolioAnswer, PortfolioScenario, RiskType, SignalId } from "@/types";

const SENTIMENT_TONE = { positive: "mint", neutral: "muted", mixed: "amber", negative: "coral" } as const;

function usageClass(v: number) {
  return v <= -30 ? "text-coral" : v <= -15 ? "text-amber" : v > 0 ? "text-mint" : "text-soft";
}

export function PortfolioTable({ scenario, selectedId, onSelect }: { scenario: PortfolioScenario; selectedId?: string; onSelect?: (id: string) => void }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{scenario.title}: account data</caption>
          <thead className="bg-black/30 text-xs uppercase tracking-wider text-faint">
            <tr>
              {onSelect && <th className="px-3 py-3 font-semibold">Pick</th>}
              <th className="px-3 py-3 font-semibold">Account</th>
              <th className="px-3 py-3 font-semibold">ARR</th>
              <th className="px-3 py-3 font-semibold">Renews in</th>
              <th className="px-3 py-3 font-semibold">Usage 30d</th>
              <th className="px-3 py-3 font-semibold">Seats active</th>
              <th className="px-3 py-3 font-semibold">Open tickets</th>
              <th className="px-3 py-3 font-semibold">Sentiment</th>
              <th className="px-3 py-3 font-semibold">Last NPS</th>
            </tr>
          </thead>
          <tbody>
            {scenario.accounts.map((a) => {
              const on = selectedId === a.id;
              return (
                <tr
                  key={a.id}
                  className={cn("border-t border-line align-top transition-colors", on ? "bg-brand/15" : onSelect && "hover:bg-white/[0.03]", onSelect && "cursor-pointer")}
                  onClick={() => onSelect?.(a.id)}
                >
                  {onSelect && (
                    <td className="px-3 py-3">
                      <input
                        type="radio"
                        name="account"
                        checked={on}
                        onChange={() => onSelect(a.id)}
                        aria-label={`Contact ${a.name} first`}
                        className="size-4 accent-[#a79bff]"
                      />
                    </td>
                  )}
                  <td className="max-w-[260px] px-3 py-3">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-xs text-faint">{a.segment}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{a.note}</p>
                  </td>
                  <td className="px-3 py-3 font-medium">{formatUSD(a.arr)}</td>
                  <td className="px-3 py-3">{a.renewalInDays} days</td>
                  <td className={cn("px-3 py-3 font-semibold", usageClass(a.usageChange30d))}>
                    {a.usageChange30d > 0 ? "+" : ""}
                    {a.usageChange30d}%
                  </td>
                  <td className="px-3 py-3">
                    {a.seatsUsed}/{a.seatsLicensed} <span className="text-faint">({Math.round(seatUtilization(a) * 100)}%)</span>
                  </td>
                  <td className="px-3 py-3">{a.openTickets}</td>
                  <td className="px-3 py-3">
                    <Badge tone={SENTIMENT_TONE[a.sentiment]}>{a.sentiment}</Badge>
                  </td>
                  <td className="px-3 py-3">{a.lastNps ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="grid gap-3 lg:hidden">
        {scenario.accounts.map((a) => (
          <AccountCard key={a.id} a={a} selected={selectedId === a.id} onSelect={onSelect} />
        ))}
      </div>
    </>
  );
}

function AccountCard({ a, selected, onSelect }: { a: Account; selected: boolean; onSelect?: (id: string) => void }) {
  const Wrapper = onSelect ? "label" : "div";
  return (
    <Wrapper className={cn("surface block rounded-2xl p-4", onSelect && "cursor-pointer", selected && "border-lavender/60 bg-brand/15")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{a.name}</p>
          <p className="text-xs text-faint">{a.segment}</p>
        </div>
        {onSelect && (
          <input
            type="radio"
            name="account-m"
            checked={selected}
            onChange={() => onSelect(a.id)}
            aria-label={`Contact ${a.name} first`}
            className="mt-1 size-5 accent-[#a79bff]"
          />
        )}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-faint">ARR</dt>
          <dd className="font-semibold">{formatUSD(a.arr)}</dd>
        </div>
        <div>
          <dt className="text-faint">Renews in</dt>
          <dd className="font-semibold">{a.renewalInDays} d</dd>
        </div>
        <div>
          <dt className="text-faint">Usage 30d</dt>
          <dd className={cn("font-semibold", usageClass(a.usageChange30d))}>
            {a.usageChange30d > 0 ? "+" : ""}
            {a.usageChange30d}%
          </dd>
        </div>
        <div>
          <dt className="text-faint">Seats active</dt>
          <dd className="font-semibold">{Math.round(seatUtilization(a) * 100)}%</dd>
        </div>
        <div>
          <dt className="text-faint">Tickets</dt>
          <dd className="font-semibold">{a.openTickets} open</dd>
        </div>
        <div>
          <dt className="text-faint">Sentiment / NPS</dt>
          <dd className="font-semibold capitalize">
            {a.sentiment} / {a.lastNps ?? "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-muted">{a.note}</p>
    </Wrapper>
  );
}

export function PortfolioForm({
  scenario,
  onSubmit,
  submitLabel = "Submit my decision",
}: {
  scenario: PortfolioScenario;
  onSubmit: (answer: PortfolioAnswer) => void;
  submitLabel?: string;
}) {
  const [accountId, setAccountId] = useState<string>();
  const [signals, setSignals] = useState<SignalId[]>([]);
  const [risk, setRisk] = useState<RiskType>();
  const [actionId, setActionId] = useState<string>();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const words = message.trim().split(/\s+/).filter(Boolean).length;
  const chosen = scenario.accounts.find((a) => a.id === accountId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!accountId) errs.account = "Pick the account you'd contact first.";
    if (signals.length === 0) errs.signals = "Select at least one signal that supports your choice.";
    if (!risk) errs.risk = "Choose the main risk.";
    if (!actionId) errs.action = "Choose an action.";
    if (words < 5) errs.message = "Write a short message to the customer (at least a sentence).";
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`q-${Object.keys(errs)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSubmit({ accountId: accountId!, signals, risk: risk!, actionId: actionId!, message });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card className="p-4 sm:p-6">
        <p className="text-sm font-semibold text-lavender">{scenario.company}</p>
        <p className="mt-1 leading-relaxed text-muted">{scenario.context}</p>
        <fieldset id="q-account" className="mt-5">
          <legend className="mb-3 font-display text-lg font-bold">1. Which account do you contact first?</legend>
          <PortfolioTable scenario={scenario} selectedId={accountId} onSelect={(id) => (setAccountId(id), setErrors({}))} />
          <Err msg={errors.account} />
        </fieldset>
      </Card>

      <Card id="q-signals" className="p-4 sm:p-6">
        <fieldset>
          <legend className="font-display text-lg font-bold">2. Which evidence supports contacting {chosen ? chosen.name : "that account"} first?</legend>
          <p className="mt-1 text-sm text-muted">Select all that apply to the account you picked. Only true, relevant evidence earns points.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {SIGNAL_OPTIONS.map((s) => {
              const on = signals.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lavender",
                    on ? "border-lavender/60 bg-brand/15" : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => setSignals(on ? signals.filter((x) => x !== s.id) : [...signals, s.id])}
                  />
                  <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border", on ? "border-lavender bg-lavender text-bg" : "border-line-strong")} aria-hidden>
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  {s.label}
                </label>
              );
            })}
          </div>
          <Err msg={errors.signals} />
        </fieldset>
      </Card>

      <Card id="q-risk" className="p-4 sm:p-6">
        <fieldset>
          <legend className="font-display text-lg font-bold">3. What is the main risk for this account?</legend>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {RISK_OPTIONS.map((r) => (
              <Radio key={r.id} name="risk" checked={risk === r.id} onChange={() => setRisk(r.id)} label={r.label} hint={r.hint} />
            ))}
          </div>
          <Err msg={errors.risk} />
        </fieldset>
      </Card>

      <Card id="q-action" className="p-4 sm:p-6">
        <fieldset>
          <legend className="font-display text-lg font-bold">4. What will you do, and what will you say?</legend>
          <div className="mt-4 grid gap-2">
            {ACTION_OPTIONS.map((a) => (
              <Radio key={a.id} name="action" checked={actionId === a.id} onChange={() => setActionId(a.id)} label={a.label} />
            ))}
          </div>
          <Err msg={errors.action} />
        </fieldset>
        <div id="q-message" className="mt-6">
          <label htmlFor={`msg-${scenario.id}`} className="font-semibold">
            Your first message to the customer
          </label>
          <p className="mt-1 text-sm text-muted">
            Write it as you&apos;d send it. A simple, documented keyword check looks for evidence, a concrete next step, the
            customer&apos;s goals and no pressure tactics. It is not a deep language evaluation.
          </p>
          <textarea
            id={`msg-${scenario.id}`}
            className="input mt-3"
            rows={5}
            maxLength={1200}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi …"
            aria-invalid={Boolean(errors.message)}
          />
          <p className={cn("mt-1 text-xs", words >= 12 ? "text-faint" : "text-amber/80")}>
            {words} words{words < 12 && " · 12+ words needed for the message check to score"}
          </p>
          <Err msg={errors.message} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          {submitLabel} <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}

export function Radio({ name, checked, onChange, label, hint }: { name: string; checked: boolean; onChange: () => void; label: string; hint?: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lavender",
        checked ? "border-lavender/60 bg-brand/15" : "border-line hover:border-line-strong",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", checked ? "border-lavender bg-lavender" : "border-line-strong")} aria-hidden>
        {checked && <span className="size-2 rounded-full bg-bg" />}
      </span>
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-faint">{hint}</span>}
      </span>
    </label>
  );
}

export function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-2 text-sm font-medium text-coral">
      {msg}
    </p>
  );
}
