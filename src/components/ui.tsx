import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info } from "lucide-react";

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "ghost" | "outline" | "mint";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-cta text-white shadow-[0_10px_30px_-10px_rgba(91,66,220,0.8)] hover:brightness-110 active:brightness-95",
  secondary: "surface text-ink hover:bg-card-hover hover:border-line-strong",
  ghost: "text-muted hover:text-ink hover:bg-white/5",
  outline: "border border-line-strong text-soft hover:border-lavender hover:text-ink",
  mint: "bg-mint text-bg hover:brightness-105",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-2xl gap-2",
  lg: "h-14 px-7 text-base rounded-2xl gap-2.5",
};

const base =
  "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none whitespace-nowrap";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

/* ---------- Surfaces ---------- */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("surface rounded-[var(--radius-card)] p-5 sm:p-6", className)} {...props} />;
}

type Tone = "brand" | "mint" | "amber" | "coral" | "muted" | "lavender";
const TONES: Record<Tone, string> = {
  brand: "bg-brand/20 text-soft border-brand/40",
  lavender: "bg-lavender/10 text-lavender border-lavender/30",
  mint: "bg-mint/10 text-mint border-mint/30",
  amber: "bg-amber/10 text-amber border-amber/30",
  coral: "bg-coral/10 text-coral border-coral/30",
  muted: "bg-white/5 text-muted border-line",
};

export function Badge({ tone = "muted", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-xs font-bold uppercase tracking-[0.18em] text-lavender", className)} {...props} />;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
  as: As = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
      <As className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</As>
      {description && <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

/* ---------- Data display ---------- */

export function ProgressBar({
  value,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  tone?: "brand" | "mint" | "amber" | "lavender" | "coral";
  className?: string;
  label?: string;
}) {
  const color = {
    brand: "bg-cta",
    mint: "bg-mint-strong",
    amber: "bg-amber",
    lavender: "bg-lavender",
    coral: "bg-coral",
  }[tone];
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-white/8", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ScoreRing({ value, max = 100, size = 112, label }: { value: number; max?: number; size?: number; label?: string }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const share = Math.max(0, Math.min(1, value / max));
  const color = share >= 0.75 ? "#6fe0b4" : share >= 0.5 ? "#a79bff" : share >= 0.3 ? "#ffd59a" : "#ffaaa5";
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(255 255 255 / 0.08)" strokeWidth={10} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - share)}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-bold leading-none">{Math.round(value)}</div>
        <div className="mt-1 text-[11px] text-muted">{label ?? `of ${max}`}</div>
      </div>
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed",
        tone === "warning" ? "border-amber/30 bg-amber/5 text-amber/90" : "border-line bg-white/[0.03] text-muted",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "warning" ? "text-amber" : "text-lavender")} aria-hidden />
      <div>
        {title && <p className="mb-0.5 font-semibold text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-0.5 font-display text-xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
    </div>
  );
}
