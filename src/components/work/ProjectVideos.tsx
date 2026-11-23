"use client";

import { useRef } from "react";
import type { Project } from "@/content/schema";
import { cn } from "@/lib/utils";

const aspect = { portrait: "aspect-[9/16]", square: "aspect-square", landscape: "aspect-video" } as const;

/**
 * A project's videos, three per row on desktop, two on tablets (vertical videos stay two per row on phones).
 * Native controls so visitors can play with sound; only one plays at a time.
 */
export function ProjectVideos({ videos, shape, title }: { videos: Project["videos"]; shape: Project["videoShape"]; title: string }) {
  const list = useRef<HTMLUListElement>(null);
  const pauseOthers = (current: HTMLVideoElement) =>
    list.current?.querySelectorAll("video").forEach((v) => {
      if (v !== current && !v.paused) v.pause();
    });

  return (
    <ul ref={list} className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", shape === "portrait" && "grid-cols-2 gap-3 sm:gap-5")}>
      {videos.map((v, i) => (
        <li key={`${v.media.videoUrl}-${i}`}>
          <figure>
            <div className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-black", aspect[shape])}>
              <video
                className="absolute inset-0 h-full w-full object-cover"
                // "#t=0.1" makes iOS show the first frame when there is no poster.
                src={v.media.imageUrl ? v.media.videoUrl : `${v.media.videoUrl}#t=0.1`}
                poster={v.media.imageUrl}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                aria-label={v.caption || `${title} — video ${i + 1}`}
                onPlay={(e) => pauseOthers(e.currentTarget)}
              />
            </div>
            {v.caption && <figcaption className="mt-3 text-sm text-fg-2">{v.caption}</figcaption>}
          </figure>
        </li>
      ))}
    </ul>
  );
}
