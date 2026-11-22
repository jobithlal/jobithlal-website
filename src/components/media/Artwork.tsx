import { cn } from "@/lib/utils";

/**
 * Designed artwork used wherever no photo or video has been uploaded yet.
 * Pure CSS/SVG: no stock or generated footage is shipped with the site.
 */

export type ArtVariant = "hero" | "reels" | "motion" | "websites" | "portrait";

function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl [background:radial-gradient(circle,color-mix(in_oklab,var(--accent)_55%,transparent),transparent_65%)]",
        className,
      )}
    />
  );
}

function Corners({ className }: { className?: string }) {
  const c = "absolute size-6 border-accent/80";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <span className={cn(c, "left-0 top-0 border-l-2 border-t-2")} />
      <span className={cn(c, "right-0 top-0 border-r-2 border-t-2")} />
      <span className={cn(c, "bottom-0 left-0 border-b-2 border-l-2")} />
      <span className={cn(c, "bottom-0 right-0 border-b-2 border-r-2")} />
    </div>
  );
}

function PhoneArt({ className }: { className?: string }) {
  return (
    <div className={className}>
    <div className="relative aspect-[9/16] rounded-[1.6rem] border border-white/15 bg-black/60 p-1.5 shadow-2xl backdrop-blur">
      <div className="relative h-full overflow-hidden rounded-[1.2rem] [background:linear-gradient(160deg,#1f2a12_0%,#0b0e0a_55%,#22300a_100%)]">
        <div className="absolute inset-x-0 top-0 h-1/2 [background:radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--accent)_45%,transparent),transparent_60%)]" />
        <div className="absolute left-3 right-3 top-3 flex gap-1">
          <span className="h-0.5 flex-1 rounded bg-white/80" />
          <span className="h-0.5 flex-1 rounded bg-white/80" />
          <span className="h-0.5 flex-1 rounded bg-white/25" />
        </div>
        <div className="absolute inset-x-3 bottom-4 space-y-1.5">
          <span className="block h-2.5 w-4/5 rounded-sm bg-accent" />
          <span className="block h-2.5 w-3/5 rounded-sm bg-white/90" />
          <span className="block h-1.5 w-2/5 rounded-sm bg-white/30" />
        </div>
        <div className="absolute bottom-4 right-3 flex flex-col items-center gap-2.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-3.5 rounded-full border border-white/50" />
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

function BrowserArt({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-white/15 bg-[#0d100d]/90 shadow-2xl backdrop-blur", className)}>
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="size-2 rounded-full bg-white/25" />
        <span className="size-2 rounded-full bg-white/25" />
        <span className="size-2 rounded-full bg-accent" />
        <span className="ml-3 h-3 flex-1 rounded-full bg-white/[0.06]" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="h-2 w-12 rounded bg-white/70" />
          <span className="flex gap-2">
            <span className="h-1.5 w-6 rounded bg-white/25" />
            <span className="h-1.5 w-6 rounded bg-white/25" />
            <span className="h-1.5 w-6 rounded bg-white/25" />
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3 pt-2">
          <div className="col-span-3 space-y-2">
            <span className="block h-3.5 w-full rounded bg-white/85" />
            <span className="block h-3.5 w-4/5 rounded bg-white/85" />
            <span className="block h-3.5 w-3/5 rounded bg-accent" />
            <span className="mt-3 block h-1.5 w-full rounded bg-white/20" />
            <span className="block h-1.5 w-5/6 rounded bg-white/20" />
            <span className="mt-3 inline-block h-4 w-16 rounded-full bg-accent" />
          </div>
          <div className="col-span-2 rounded-lg [background:linear-gradient(140deg,#24320c,#0b0e0a)]" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-10 rounded-md border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MotionArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="mg-a" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d="M30 230 C 120 40, 230 300, 370 70" fill="none" stroke="var(--accent-text)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7" />
        <circle cx="30" cy="230" r="5" fill="var(--accent)" />
        <circle cx="370" cy="70" r="5" fill="var(--accent)" />
        <g style={{ transformOrigin: "120px 120px", animation: "drift 9s ease-in-out infinite" }}>
          <circle cx="120" cy="120" r="56" fill="url(#mg-a)" />
        </g>
        <g style={{ transformOrigin: "275px 175px", animation: "drift 11s ease-in-out infinite reverse" }}>
          <rect x="235" y="135" width="80" height="80" rx="14" fill="none" stroke="var(--text)" strokeOpacity="0.85" strokeWidth="2" />
        </g>
        <polygon points="300,40 336,100 264,100" fill="none" stroke="var(--accent-text)" strokeWidth="2" />
        <g transform="translate(40 270)">
          <line x1="0" x2="320" y1="0" y2="0" stroke="var(--text)" strokeOpacity="0.2" />
          {[0, 70, 150, 230, 320].map((x) => (
            <rect key={x} x={x - 4} y={-4} width="8" height="8" transform={`rotate(45 ${x} 0)`} fill={x === 150 ? "var(--accent)" : "var(--text)"} fillOpacity={x === 150 ? 1 : 0.6} />
          ))}
          <line x1="150" x2="150" y1="-14" y2="14" stroke="var(--accent-text)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

export function Artwork({ variant, className }: { variant: ArtVariant; className?: string }) {
  if (variant === "hero") {
    return (
      <div aria-hidden className={cn("grain absolute inset-0 overflow-hidden bg-bg", className)}>
        {/* The backdrop follows the site theme; the device mock-ups inside stay dark. */}
        <div className="absolute inset-0 [background:radial-gradient(120%_90%_at_78%_45%,color-mix(in_srgb,var(--accent)_14%,var(--bg))_0%,color-mix(in_srgb,var(--accent)_5%,var(--bg))_45%,var(--bg)_75%)]" />
        <Glow className="right-[8%] top-[18%] size-[46vw] max-w-[760px] opacity-40" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--text)_1px,transparent_1px),linear-gradient(90deg,var(--text)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(70%_70%_at_70%_50%,#000,transparent)]" />
        {/* Viewfinder */}
        <div className="absolute right-[4%] top-1/2 hidden aspect-[16/10] w-[50%] -translate-y-1/2 md:block lg:w-[46%]">
          <Corners />
          <div className="absolute left-6 top-5 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-fg/70">
            <span className="size-2 rounded-full bg-[#ff3b30]" style={{ animation: "rec-blink 1.4s steps(1) infinite" }} />
            REC
          </div>
          <div className="absolute right-6 top-5 font-mono text-[11px] tracking-[0.2em] text-fg/50">4K · 25P</div>
          <div className="absolute bottom-5 left-6 font-mono text-[11px] tracking-[0.2em] text-accent-fg/90">00:00:16:00</div>
          <div className="absolute bottom-5 right-6 h-1 w-24 overflow-hidden rounded bg-fg/15">
            <span className="block h-full w-1/2 bg-accent" style={{ animation: "scan 3.5s linear infinite" }} />
          </div>
          <div className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute left-1/2 top-0 h-full w-px bg-fg/30" />
            <span className="absolute left-0 top-1/2 h-px w-full bg-fg/30" />
          </div>
          {/* Service objects floating inside the frame */}
          <div data-theme="dark" className="contents">
            <BrowserArt className="absolute right-[18%] top-[16%] w-[62%] rotate-2" />
            <PhoneArt className="absolute -bottom-[4%] right-[5%] w-[22%] rotate-6" />
          </div>
          <MotionArt className="absolute bottom-[6%] left-[2%] w-[36%] opacity-80" />
        </div>
        {/* Mobile composition */}
        <div className="absolute inset-x-0 bottom-0 h-[40%] opacity-60 md:hidden [[data-theme=light]_&]:opacity-25">
          <Corners className="inset-x-6 inset-y-4" />
          <div data-theme="dark" className="contents">
            <PhoneArt className="absolute bottom-8 right-10 w-[32%] rotate-6" />
            <BrowserArt className="absolute bottom-16 left-8 w-[52%] -rotate-3" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "reels") {
    return (
      <div aria-hidden data-theme="dark" className={cn("grain absolute inset-0 overflow-hidden [container-type:size] [background:linear-gradient(160deg,#141a10,#0a0c09)]", className)}>
        <Glow className="-right-10 -top-10 size-64 opacity-30" />
        <PhoneArt className="absolute left-1/2 top-1/2 w-[min(38cqw,42cqh)] -translate-x-1/2 -translate-y-1/2 -rotate-3 transition-transform duration-700 group-hover:rotate-0" />
        <PhoneArt className="absolute left-[calc(50%-min(38cqw,42cqh))] top-[58%] w-[min(22cqw,25cqh)] -translate-y-1/2 -rotate-12 opacity-40" />
        <PhoneArt className="absolute right-[calc(50%-min(38cqw,42cqh))] top-[42%] w-[min(22cqw,25cqh)] -translate-y-1/2 rotate-12 opacity-40" />
      </div>
    );
  }

  if (variant === "motion") {
    return (
      <div aria-hidden data-theme="dark" className={cn("grain absolute inset-0 overflow-hidden [background:linear-gradient(200deg,#11160d,#090b08)]", className)}>
        <Glow className="left-1/4 top-1/4 size-64 opacity-25" />
        <MotionArt className="absolute inset-[10%]" />
      </div>
    );
  }

  if (variant === "websites") {
    return (
      <div aria-hidden data-theme="dark" className={cn("grain absolute inset-0 overflow-hidden [container-type:size] [background:linear-gradient(130deg,#10150d,#090b08)]", className)}>
        <Glow className="-bottom-10 -left-10 size-64 opacity-25" />
        <BrowserArt className="absolute left-1/2 top-1/2 w-[min(80cqw,125cqh)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:-translate-y-[52%]" />
      </div>
    );
  }

  // portrait
  return (
    <div aria-hidden data-theme="dark" className={cn("grain absolute inset-0 overflow-hidden [background:radial-gradient(90%_70%_at_50%_35%,#1d2712,#0a0c09_70%)]", className)}>
      <Glow className="left-1/2 top-1/3 size-72 -translate-x-1/2 opacity-30" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative grid aspect-square w-[62%] place-items-center rounded-full border border-white/15">
          <span className="absolute inset-[12%] rounded-full border border-dashed border-accent/40" />
          <span className="absolute -inset-px rounded-full border border-accent/60" style={{ animation: "pulse-ring 3.6s var(--ease-out) infinite" }} />
          <span className="font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-none tracking-tight">
            <span className="text-accent-fg">/</span>JL
          </span>
        </div>
      </div>
      <Corners className="inset-6" />
    </div>
  );
}
