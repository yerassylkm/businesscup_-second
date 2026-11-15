import { ArrowRightLeft, Compass, Layers3 } from "lucide-react";
import type { PathId } from "@/types";
import { cn } from "@/lib/utils";

/** shifto mark: an "S" path that turns into a forward arrow (same as public/brand/shifto-mark.svg). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="shifto-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4F31BA" />
          <stop offset="0.55" stopColor="#5B42DC" />
          <stop offset="1" stopColor="#8F7CFF" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="30" fill="url(#shifto-g)" />
      <path
        d="M34 86 H68 A15 15 0 0 0 68 56 H52 A15 15 0 0 1 52 26 H80"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M76 15 L90 26 L76 37" fill="none" stroke="#BFF3DE" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-sans text-[22px] font-extrabold leading-none tracking-[-0.03em]">
        shift<span className="text-lavender">o</span>
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
