"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import { mainNav } from "./nav";
import { Logo } from "./Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ServiceLink = { slug: string; title: string; subtitle: string };

export function Header({
  logo,
  services,
  behavior = "auto-hide",
}: {
  logo: { text: string; subtitle: string; imageUrl?: string };
  services: ServiceLink[];
  behavior?: "auto-hide" | "sticky";
}) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const isHome = pathname === "/";

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    if (behavior === "auto-hide") setHidden(y > 420 && y > prev && !open);
  });

  // Active section tracking on the homepage.
  useEffect(() => {
    if (!isHome) return;
    const ids = mainNav.map((n) => n.section).filter(Boolean) as string[];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  // Close the mobile menu after navigation (state-from-props pattern, no effect needed).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  const isActive = (n: (typeof mainNav)[number]) => {
    if (isHome) return n.section === activeSection;
    if (!n.match || n.match === "/") return false;
    return pathname.startsWith(n.match);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <motion.header
        initial={false}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open
            ? "border-b border-line/70 bg-bg/75 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-gradient-to-b from-bg/80 to-transparent",
        )}
      >
        <div className="container-x flex h-20 items-center justify-between gap-6 lg:h-24">
          <Logo text={logo.text} subtitle={logo.subtitle} imageUrl={logo.imageUrl} />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((n) =>
                n.label === "Services" ? (
                  <ServicesDropdown key={n.label} item={n} services={services} active={isActive(n)} />
                ) : (
                  <li key={n.label}>
                    <NavLink href={n.href} active={isActive(n)}>
                      {n.label}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ButtonLink href="/contact" className="h-12 px-6">
                Start a project
              </ButtonLink>
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-12 place-items-center rounded-full border border-line bg-white/[0.03] text-fg transition-colors hover:border-accent hover:text-accent lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} services={services} isActive={isActive} />
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative block px-4 py-2.5 text-[0.82rem] font-medium uppercase tracking-[0.14em] transition-colors",
        active ? "text-fg" : "text-fg-2 hover:text-fg",
      )}
    >
      {children}
      {active && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-accent"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
    </Link>
  );
}

function ServicesDropdown({
  item,
  services,
  active,
}: {
  item: (typeof mainNav)[number];
  services: ServiceLink[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const hoverOpenedAt = useRef(0);
  const enter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) hoverOpenedAt.current = Date.now();
    setOpen(true);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="flex items-center">
        <NavLink href={item.href} active={active}>
          {item.label}
        </NavLink>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label="Show service pages"
          onClick={() => {
            // A hover just opened it: the click that follows shouldn't immediately close it.
            if (Date.now() - hoverOpenedAt.current < 400) return setOpen(true);
            setOpen((o) => !o);
          }}
          className="-ml-3 grid size-7 place-items-center rounded-full text-fg-2 hover:text-accent"
        >
          <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full w-[22rem] -translate-x-1/2 pt-3"
          >
            <ul className="overflow-hidden rounded-2xl border border-line bg-card/95 p-2 shadow-2xl backdrop-blur-xl">
              {services.map((s, i) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-elevated focus-visible:bg-elevated"
                  >
                    <span className="font-display text-sm font-bold text-accent">0{i + 1}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-fg">{s.title}</span>
                      <span className="block text-xs text-muted">{s.subtitle}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-muted transition-all group-hover:rotate-45 group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function MobileMenu({
  open,
  onClose,
  services,
  isActive,
}: {
  open: boolean;
  onClose: () => void;
  services: ServiceLink[];
  isActive: (n: (typeof mainNav)[number]) => boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a,button");
        const a = f[0];
        const b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-bg pt-24 lg:hidden"
        >
          <div className="pointer-events-none absolute -right-24 top-24 size-80 rounded-full bg-accent/10 blur-3xl" />
          <nav aria-label="Mobile" className="container-x flex-1">
            <ul className="border-t border-line">
              {mainNav.map((n, i) => (
                <motion.li
                  key={n.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-line"
                >
                  <Link
                    href={n.href}
                    onClick={onClose}
                    className="flex items-center justify-between py-4 font-display text-[2rem] font-bold uppercase leading-none tracking-tight"
                  >
                    <span className={cn(isActive(n) ? "text-accent" : "text-fg")}>{n.label}</span>
                    <span className="text-xs font-medium tracking-[0.2em] text-muted">0{i + 1}</span>
                  </Link>
                  {n.label === "Services" && (
                    <ul className="-mt-1 mb-4 space-y-2 pl-1">
                      {services.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/services/${s.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-2 text-sm text-fg-2 hover:text-accent"
                          >
                            <ArrowUpRight className="size-3.5 text-accent" />
                            {s.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.li>
              ))}
            </ul>
          </nav>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="container-x pb-10 pt-8"
          >
            <ButtonLink href="/contact" magnetic={false} className="w-full" onClick={onClose}>
              Start a project
            </ButtonLink>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
