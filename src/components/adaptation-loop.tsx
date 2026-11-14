import { ArrowRight, ClipboardList, FlaskConical, Map, RefreshCcw, Route, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: ClipboardList, title: "Assess", body: "Your real tasks and skills" },
  { icon: Route, title: "Choose a path", body: "Adapt, Pivot or Reinvent" },
  { icon: FlaskConical, title: "Practice", body: "Scored work simulations" },
  { icon: Map, title: "Progress updates your plan", body: "Measured skills reshape your gaps" },
  { icon: Trophy, title: "Next challenge", body: "A new weekly mission" },
];

/** The Continuous Adaptation Loop: how the product's modules connect. */
export function AdaptationLoop({ className }: { className?: string }) {
  return (
    <figure className={cn("surface rounded-[var(--radius-card)] p-5 sm:p-6", className)}>
      <figcaption className="flex items-center gap-2 font-display text-lg font-bold">
        <RefreshCcw className="size-5 text-lavender" aria-hidden /> Continuous Adaptation Loop
      </figcaption>
      <ol className="mt-5 grid gap-3 md:grid-cols-5 md:gap-2" aria-label="Continuous Adaptation Loop steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex items-center gap-3 rounded-2xl bg-black/20 p-3 md:flex-col md:items-start md:pr-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/25">
              <s.icon className="size-4 text-soft" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-snug">
                <span className="text-faint">{i + 1}. </span>
                {s.title}
              </span>
              <span className="block text-xs text-muted">{s.body}</span>
            </span>
            {i < STEPS.length - 1 && (
              <ArrowRight
                className="absolute -right-2.5 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-lavender md:block"
                aria-hidden
              />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <RefreshCcw className="size-3.5 shrink-0 text-lavender" aria-hidden />
        After each challenge the loop repeats from step 3. Your plan, skill gaps and Career Radar update from what you actually
        demonstrated.
      </p>
    </figure>
  );
}
