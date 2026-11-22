"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import type { Project } from "@/content/schema";
import { categoryLabelOf } from "@/content/projects";
import { artFor, isVideoCategory } from "@/content/service-map";
import { MediaFrame } from "@/components/media/MediaFrame";
import { cn } from "@/lib/utils";


export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      data-theme="dark"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent/60 bg-black/60 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-accent-fg backdrop-blur",
        className,
      )}
    >
      Sample layout
    </span>
  );
}

export function ProjectCard({ project, className, aspect = "aspect-[4/5]" }: { project: Project; className?: string; aspect?: string }) {
  const [hover, setHover] = useState(false);
  const isVideo = (project.isDemo && isVideoCategory(project.category)) || !!project.cover.videoUrl || !!project.externalVideoUrl;
  const client = project.client && !project.hideClient ? project.client : null;

  return (
    <Link
      href={`/work/${project.slug}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={cn("group block", className)}
      data-track="portfolio_open"
      data-track-label={project.title}
      aria-label={`${project.title}${project.isDemo ? " (sample layout)" : ""} — view project`}
    >
      <div data-theme="dark" className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-card transition-colors duration-500 group-hover:border-accent/60", aspect)}>
        <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-out)] group-hover:scale-[1.07]">
          <MediaFrame media={project.cover} art={artFor(project.category)} sizes="(min-width:1024px) 30vw, 85vw" playOnHover hovered={hover} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-4 right-[4.25rem] top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/60 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-fg backdrop-blur">
            {categoryLabelOf(project)}
          </span>
          {project.isDemo && <DemoBadge />}
        </div>
        {isVideo && (
          <span aria-hidden className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/20 bg-black/40 backdrop-blur transition-all duration-500 group-hover:scale-110 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
            <Play className="size-4 translate-x-px fill-current" />
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          {client && <p className="text-xs uppercase tracking-[0.18em] text-fg-2">{client}</p>}
          <div className="flex items-end justify-between gap-4">
            <div className="overflow-hidden">
              <h3 className="font-display text-xl font-bold leading-tight tracking-tight transition-transform duration-500 group-hover:-translate-y-0.5 sm:text-2xl">
                {project.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 max-h-0 text-sm text-fg-2 opacity-0 transition-all duration-500 group-hover:max-h-12 group-hover:opacity-100 group-focus-visible:max-h-12 group-focus-visible:opacity-100">
                {project.summary}
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-ink transition-transform duration-500 group-hover:rotate-45">
              <ArrowUpRight className="size-5" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
