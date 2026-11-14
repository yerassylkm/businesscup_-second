import { ArrowRightLeft, Compass, Layers3 } from "lucide-react";
import type { PathId } from "@/types";
import { cn } from "@/lib/utils";

/** Original PIVOTREADY mark: an angled path that turns upward. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="pr-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#5B42DC" />
          <stop offset="1" stopColor="#8B93FF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#pr-g)" />
      <path d="M8 22 L14 16 L18 19 L24 10" stroke="#FAF9FF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 10 H24 V15" stroke="#BFF3DE" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight">
        PIVOT<span className="text-lavender">READY</span>
      </span>
    </span>
  );
}

export const PATH_STYLE: Record<PathId, { color: string; ring: string; bg: string; text: string; Icon: typeof Layers3; shape: string }> = {
  adapt: {
    color: "#A79BFF",
    ring: "ring-lavender/50",
    bg: "bg-lavender/10",
    text: "text-lavender",
    Icon: Layers3,
    shape: "rounded-2xl",
  },
  pivot: {
    color: "#8B93FF",
    ring: "ring-periwinkle/60",
    bg: "bg-periwinkle/10",
    text: "text-periwinkle",
    Icon: ArrowRightLeft,
    shape: "rounded-[6px_22px_6px_22px]",
  },
  reinvent: {
    color: "#FFD59A",
    ring: "ring-amber/50",
    bg: "bg-amber/10",
    text: "text-amber",
    Icon: Compass,
    shape: "rotate-45 rounded-lg",
  },
};

export function PathGlyph({ pathId, className }: { pathId: PathId; className?: string }) {
  const s = PATH_STYLE[pathId];
  const Icon = s.Icon;
  return (
    <span className={cn("relative inline-flex size-11 shrink-0 items-center justify-center", className)}>
      <span className={cn("absolute inset-1 border", s.shape)} style={{ borderColor: `${s.color}66`, background: `${s.color}1a` }} />
      <Icon className="relative size-5" style={{ color: s.color }} aria-hidden />
    </span>
  );
}
