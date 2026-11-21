"use client";

import Link from "next/link";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { ArrowUpRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "dark";
type Icon = "arrow" | "play" | "none";

const base =
  "group/btn relative inline-flex select-none whitespace-nowrap items-center justify-center gap-3 overflow-hidden rounded-[var(--radius-btn)] font-semibold uppercase tracking-[0.12em] text-[0.78rem] sm:text-[0.8rem] h-14 px-7 transition-[color,background-color,border-color,box-shadow] duration-300 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink hover:shadow-[0_0_0_1px_var(--accent),0_10px_40px_-10px_color-mix(in_oklab,var(--accent)_70%,transparent)]",
  ghost: "border border-line bg-white/[0.02] text-fg backdrop-blur-sm hover:border-accent hover:text-accent",
  dark: "bg-ink text-accent hover:bg-black hover:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)]",
};

function IconEl({ icon }: { icon: Icon }) {
  if (icon === "none") return null;
  if (icon === "play")
    return (
      <span className="grid size-6 place-items-center rounded-full border border-current transition-transform duration-500 group-hover/btn:scale-110">
        <Play className="size-2.5 fill-current" aria-hidden />
      </span>
    );
  return (
    <ArrowUpRight
      className="size-4 transition-transform duration-500 ease-[var(--ease-out)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:rotate-45"
      aria-hidden
    />
  );
}

/** Wraps children in a magnetic pull on fine pointers; inert on touch and reduced motion. */
export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.div>
  );
}

type CommonProps = {
  variant?: Variant;
  icon?: Icon;
  magnetic?: boolean;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  icon = "arrow",
  magnetic = true,
  className,
  children,
  ...rest
}: CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  const el = (
    <Link href={href} className={cn(base, variants[variant], className)} {...rest}>
      <span className="relative z-10">{children}</span>
      <span className="relative z-10">
        <IconEl icon={icon} />
      </span>
    </Link>
  );
  return magnetic ? <Magnetic className={className?.includes("w-full") ? "w-full" : undefined}>{el}</Magnetic> : el;
}

export function Button({
  variant = "primary",
  icon = "arrow",
  magnetic = false,
  className,
  children,
  ...rest
}: CommonProps & Omit<ComponentProps<"button">, "className" | "children">) {
  const el = (
    <button className={cn(base, variants[variant], className)} {...rest}>
      <span className="relative z-10">{children}</span>
      <span className="relative z-10">
        <IconEl icon={icon} />
      </span>
    </button>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}
