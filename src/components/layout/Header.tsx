"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import { blogNavItem, headerNav, mainNav } from "./nav";
import { Logo } from "./Logo";
import { ThemeToggle } from "./Theme";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ServiceLink = { slug: string; title: string; subtitle: string };

type HeaderProps = {
  logo: { text: string; subtitle: string; imageUrl?: string };
  services: ServiceLink[];
  /** Show the visitor light/dark switch (Admin → Settings → Appearance). */
  themeToggle?: boolean;
  /** Show the Blog link in the main menu (Admin → Blog). */
  showBlog?: boolean;
  behavior?: "auto-hide" | "sticky";
};

/** Reads the URL, so it must render inside <Suspense> (see SiteChrome). */
export function Header(props: HeaderProps) {
  return <HeaderShell {...props} pathname={usePathname()} />;
}

/**
 * The header itself. `pathname` is passed in so a static copy (without the
 * active-page underline) can be prerendered as the Suspense fallback.
 */
export function HeaderShell({ logo, services, themeToggle, showBlog = false, behavior = "auto-hide", pathname }: HeaderProps & { pathname: string | null }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const isHome = pathname === "/";
  // On the homepage the hero carries its own split navigation at `split:` widths,
  // so this header stays out of the way until the visitor scrolls past the hero.
  const [pastHero, setPastHero] = useState(false);
  const path = pathname ?? "";
  const nav = headerNav(showBlog);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    if (isHome) {
      const hero = document.getElementById("top");
      setPastHero(y > (hero ? hero.offsetTop + hero.offsetHeight - 96 : 600));
    }
    if (behavior === "auto-hide") setHidden(y > 420 && y > prev && !open);
  });

  // Correct state when the page loads already scrolled (refresh mid-page, back navigation).
  useEffect(() => {
    if (!isHome) return;
    const raf = requestAnimationFrame(() => {
      const hero = document.getElementById("top");
      setPastHero(window.scrollY > (hero ? hero.offsetTop + hero.offsetHeight - 96 : 600));
    });
    return () => cancelAnimationFrame(raf);
  }, [isHome]);

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
  const [prevPath, setPrevPath] = useState(path);
  if (path !== prevPath) {
    setPrevPath(path);
    setOpen(false);
  }

  const isActive = (n: (typeof mainNav)[number]) => {
    if (isHome) return n.section === activeSection;
    if (!n.match || n.match === "/") return false;
    return path.startsWith(n.match);
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
        data-over-hero={isHome && !pastHero ? "" : undefined}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter,opacity,visibility] duration-500",
          isHome && !pastHero && "split:invisible split:opacity-0",
          scrolled || open
            ? "border-b border-line/70 bg-bg/75 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-gradient-to-b from-bg/80 to-transparent",
        )}
      >
        <div className="container-x flex h-20 items-center justify-between gap-6 lg:h-24">
          {/* Left: logo + navigation in an outlined pill (active page = filled pill) */}
          <div className="flex min-w-0 items-center gap-8">
            <Logo text={logo.text} subtitle={logo.subtitle} imageUrl={logo.imageUrl} />

            <nav aria-label="Main" className="hidden split:block">
              <ul className="flex items-center gap-0.5 rounded-full border border-line bg-bg/50 p-1 backdrop-blur-md">
                {nav.map((n) =>
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
          </div>

          {/* Right: matching pill with the main action and round icon buttons */}
          <div className="flex items-center gap-1 rounded-full border border-line bg-bg/50 p-1 backdrop-blur-md">
            <div className="hidden sm:block">
              <ButtonLink href="/contact" className="h-11 px-7">
                Start a project
              </ButtonLink>
            </div>
            {themeToggle && (
              <ThemeToggle className="size-11 border-transparent bg-fg/[0.06] hover:border-transparent hover:bg-fg/[0.12]" />
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-11 place-items-center rounded-full bg-fg/[0.06] text-fg transition-colors hover:bg-fg/[0.12] hover:text-accent-fg split:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} services={services} isActive={isActive} nav={nav} />
    </>
  );
}

export function ActivePill() {
  return (
    <motion.span
      layoutId="nav-indicator"
      aria-hidden
      className="absolute inset-0 rounded-full bg-fg"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  );
}

export function NavLink({
  href,
  active,
  pill = true,
  className,
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  /** Draw the filled active pill here (false when a parent draws it). */
  pill?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative block rounded-full px-[1.15rem] py-2.5 text-[0.84rem] font-semibold transition-colors",
        active ? "text-bg" : "text-fg-2 hover:text-fg",
        className,
      )}
    >
      {active && pill && <ActivePill />}
      <span className="relative">{children}</span>
    </Link>
  );
}

export function ServicesDropdown({
  item,
  services,
  active,
  linkClassName,
}: {
  item: (typeof mainNav)[number];
  services: ServiceLink[];
  active: boolean;
  linkClassName?: string;
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
      <div className="relative flex items-center rounded-full">
        {active && <ActivePill />}
        <NavLink href={item.href} active={active} pill={false} className={linkClassName}>
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
          className={cn(
            "relative -ml-2.5 mr-1.5 grid size-7 place-items-center rounded-full transition-colors",
            active ? "text-bg/70 hover:text-bg" : "text-fg-2 hover:text-accent-fg",
          )}
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
            <ul className="overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-2xl">
              {services.map((s, i) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-elevated focus-visible:bg-elevated"
                  >
                    <span className="font-display text-sm font-bold text-accent-fg">0{i + 1}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-fg">{s.title}</span>
                      <span className="block text-xs text-muted">{s.subtitle}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-muted transition-all group-hover:rotate-45 group-hover:text-accent-fg" />
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
  nav,
}: {
  open: boolean;
  onClose: () => void;
  services: ServiceLink[];
  isActive: (n: (typeof mainNav)[number]) => boolean;
  nav: (typeof mainNav)[number][];
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
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-bg pt-24 split:hidden"
        >
          <div className="pointer-events-none absolute -right-24 top-24 size-80 rounded-full bg-accent/10 blur-3xl" />
          <nav aria-label="Mobile" className="container-x flex-1">
            <ul className="space-y-2.5">
              {nav.map((n, i) => (
                <motion.li
                  key={n.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={n.href}
                    onClick={onClose}
                    aria-current={isActive(n) ? "page" : undefined}
                    className={cn(
                      "group flex items-center justify-between rounded-full border py-2 pl-6 pr-2 transition-colors",
                      isActive(n)
                        ? "border-fg bg-fg text-bg"
                        : "border-line text-fg hover:border-fg/40",
                    )}
                  >
                    <span className="font-display text-[1.65rem] font-bold uppercase leading-none tracking-tight">
                      {n.label}
                    </span>
                    <span
                      className={cn(
                        "grid size-11 place-items-center rounded-full transition-transform group-hover:rotate-45",
                        isActive(n) ? "bg-bg text-fg" : "bg-accent text-black",
                      )}
                    >
                      <ArrowUpRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                  {n.label === "Services" && (
                    <ul className="flex flex-wrap gap-2 px-1 pb-1 pt-3">
                      {services.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/services/${s.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm text-fg-2 transition-colors hover:border-accent hover:text-accent-fg"
                          >
                            {s.title}
                            <ArrowUpRight className="size-3.5 text-accent-fg" aria-hidden />
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
            <ButtonLink href="/contact" magnetic={false} className="h-14 w-full" onClick={onClose}>
              Start a project
            </ButtonLink>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Split navigation for the homepage hero (`split:` widths only).
 * The menu is divided into two rounded pills that sit in the hero grid on
 * either side of the hero image: page links on the left, the remaining links
 * plus the contact call-to-action (and theme switch) on the right.
 * ──────────────────────────────────────────────────────────────────────────── */

export type SplitNavProps = {
  services: ServiceLink[];
  themeToggle?: boolean;
  showBlog?: boolean;
};

const PILL =
  "flex h-14 items-center rounded-full border border-line bg-elevated/70 p-1 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md";
const PILL_LINK = "px-3.5 2xl:px-[1.1rem]";

/** Left half: Home, Services (with dropdown), Work and — when enabled — Blog. Contact lives in the right pill's CTA. */
export function splitNavGroups(showBlog: boolean) {
  const items = mainNav.filter((n) => n.label !== "Contact");
  const left = items.slice(0, 3);
  const right = items.slice(3);
  if (showBlog) left.push(blogNavItem);
  return { left, right };
}

export function SplitNavLeft({ services, showBlog = false }: SplitNavProps) {
  const { left } = splitNavGroups(showBlog);
  return (
    <LayoutGroup id="hero-nav">
      <nav aria-label="Main" className="min-w-0">
        <ul className={cn(PILL, "justify-between gap-0.5")}>
          {left.map((n, i) =>
            n.label === "Services" ? (
              <ServicesDropdown key={n.label} item={n} services={services} active={false} linkClassName={PILL_LINK} />
            ) : (
              <li key={n.label}>
                <NavLink href={n.href} active={i === 0} className={PILL_LINK}>
                  {n.label}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>
    </LayoutGroup>
  );
}

export function SplitNavRight({ themeToggle, showBlog = false }: SplitNavProps) {
  const { right } = splitNavGroups(showBlog);
  return (
    <nav aria-label="More pages and contact" className="min-w-0">
      <ul className={cn(PILL, "gap-0.5")}>
        {right.map((n) => (
          <li key={n.label}>
            <NavLink href={n.href} active={false} className={PILL_LINK}>
              {n.label}
            </NavLink>
          </li>
        ))}
        <li className="min-w-0 flex-1">
          <ButtonLink href="/contact" magnetic={false} className="h-12 w-full whitespace-nowrap px-4 text-[0.7rem]">
            Start a project
          </ButtonLink>
        </li>
        {themeToggle && (
          <li>
            <ThemeToggle className="size-12 border-transparent bg-fg/[0.06] hover:border-transparent hover:bg-fg/[0.12]" />
          </li>
        )}
      </ul>
    </nav>
  );
}
