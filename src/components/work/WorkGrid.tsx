"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Project } from "@/content/schema";
import { ProjectCard } from "./ProjectCard";
import { CategoryFilter, useFilteredProjects } from "./WorkSlider";

export function WorkGrid({ projects }: { projects: Project[] }) {
  const { filter, setFilter, counts, filters, list } = useFilteredProjects(projects);
  return (
    <div>
      <CategoryFilter value={filter} onChange={setFilter} counts={counts} filters={filters} />
      <p className="sr-only" aria-live="polite">
        {list.length} project{list.length === 1 ? "" : "s"} shown
      </p>
      {list.length === 0 ? (
        <p className="mt-12 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-fg-2">
          No projects in this category yet.
        </p>
      ) : (
        <motion.ul layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <motion.li
                key={p.slug}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 6) * 0.05 }}
                className={i % 5 === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}
              >
                <ProjectCard project={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
