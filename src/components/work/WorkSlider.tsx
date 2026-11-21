"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Project, ProjectCategory } from "@/content/schema";
import { categoryLabels } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { cn } from "@/lib/utils";

type Filter = "all" | ProjectCategory;
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All projects" },
  { id: "reels", label: categoryLabels.reels },
  { id: "motion", label: categoryLabels.motion },
  { id: "websites", label: categoryLabels.websites },
];

export function CategoryFilter({ value, onChange, counts }: { value: Filter; onChange: (f: Filter) => void; counts: Record<Filter, number> }) {
  return (
    <div role="group" aria-label="Filter projects by category" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          aria-pressed={value === f.id}
          onClick={() => onChange(f.id)}
          className={cn(
            "relative shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
            value === f.id ? "border-accent text-ink" : "border-line text-fg-2 hover:border-fg-2 hover:text-fg",
          )}
        >
          {value === f.id && (
            <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
          )}
          <span className="relative">
            {f.label} <span className="opacity-60">({counts[f.id]})</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function useFilteredProjects(projects: Project[]) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(() => {
    const c = { all: projects.length, reels: 0, motion: 0, websites: 0 } as Record<Filter, number>;
    projects.forEach((p) => c[p.category]++);
    return c;
  }, [projects]);
  const list = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  return { filter, setFilter, counts, list };
}

/** Horizontal, scroll-snapped project slider (desktop) — swipeable on touch. */
export function WorkSlider({ projects }: { projects: Project[] }) {
  const { filter, setFilter, counts, list } = useFilteredProjects(projects);
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };

  useEffect(() => {
    updateEdges();
    track.current?.scrollTo({ left: 0 });
  }, [filter]);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div>
      <div className="container-x flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <CategoryFilter value={filter} onChange={setFilter} counts={counts} />
        <div className="hidden gap-2 md:flex">
          <SliderButton label="Previous projects" disabled={edges.start} onClick={() => scrollBy(-1)}>
            <ArrowLeft className="size-5" />
          </SliderButton>
          <SliderButton label="Next projects" disabled={edges.end} onClick={() => scrollBy(1)}>
            <ArrowRight className="size-5" />
          </SliderButton>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="container-x mt-10 text-fg-2">No projects in this category yet.</p>
      ) : (
        <ul
          ref={track}
          onScroll={updateEdges}
          aria-label="Projects"
          className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingInline: "max(var(--gutter), calc((100vw - var(--max-w)) / 2 + var(--gutter)))", scrollPaddingInline: "max(var(--gutter), calc((100vw - var(--max-w)) / 2 + var(--gutter)))" }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((p, i) => (
              <motion.li
                key={p.slug}
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 4) * 0.07 }}
                className="w-[82vw] shrink-0 snap-start sm:w-[46vw] lg:w-[calc((min(100vw,var(--max-w))-2*var(--gutter)-2.5rem)/3.15)]"
              >
                <ProjectCard project={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function SliderButton({ children, label, disabled, onClick }: { children: React.ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-14 place-items-center rounded-full border border-line text-fg transition-colors hover:border-accent hover:bg-accent hover:text-ink disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
