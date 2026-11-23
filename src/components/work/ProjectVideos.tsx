"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Project } from "@/content/schema";
import { cn } from "@/lib/utils";

const aspect = { portrait: "aspect-[9/16]", square: "aspect-square", landscape: "aspect-video" } as const;

/**
 * A project's videos — uploaded files or YouTube/Vimeo links — three per row on
 * desktop, two on tablets (vertical videos stay two per row on phones).
 * Only one plays at a time. Links load their player only when clicked.
 */
export function ProjectVideos({ videos, shape, title }: { videos: Project["videos"]; shape: Project["videoShape"]; title: string }) {
  const list = useRef<HTMLUListElement>(null);
  const [activeEmbed, setActiveEmbed] = useState<number | null>(null);
  const pauseFiles = (except?: HTMLVideoElement) =>
    list.current?.querySelectorAll("video").forEach((v) => {
      if (v !== except && !v.paused) v.pause();
    });

  return (
    <ul ref={list} className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", shape === "portrait" && "grid-cols-2 gap-3 sm:gap-5")}>
      {videos.map((v, i) => {
        const label = v.caption || `${title} — video ${i + 1}`;
        return (
          <li key={i}>
            <figure>
              <div className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-black", aspect[shape])}>
                {v.media?.videoUrl ? (
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    // "#t=0.1" makes iOS show the first frame when there is no poster.
                    src={v.media.imageUrl ? v.media.videoUrl : `${v.media.videoUrl}#t=0.1`}
                    poster={v.media.imageUrl}
                    controls
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                    aria-label={label}
                    onPlay={(e) => {
                      pauseFiles(e.currentTarget);
                      setActiveEmbed(null);
                    }}
                  />
                ) : v.embed ? (
                  activeEmbed === i ? (
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`${v.embed.embedUrl}${v.embed.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
                      title={label}
                      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        pauseFiles();
                        setActiveEmbed(i);
                      }}
                      aria-label={`Play: ${label}`}
                      className="group absolute inset-0 grid place-items-center"
                    >
                      {v.embed.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- external YouTube/Vimeo thumbnail
                        <img src={v.embed.thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                      )}
                      <span className="relative grid size-16 place-items-center rounded-full bg-accent text-ink shadow-xl transition-transform duration-300 group-hover:scale-110">
                        <Play className="ml-0.5 size-6 fill-current" aria-hidden />
                      </span>
                      <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                        {v.embed.provider === "vimeo" ? "Vimeo" : "YouTube"}
                      </span>
                    </button>
                  )
                ) : null}
              </div>
              {v.caption && <figcaption className="mt-3 text-sm text-fg-2">{v.caption}</figcaption>}
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
