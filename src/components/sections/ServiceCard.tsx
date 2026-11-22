"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Box, Brush, Camera, Clapperboard, CodeXml, Film, Image, LayoutTemplate, Megaphone, Palette, PenTool, Sparkles, UserRound, Video, WandSparkles } from "lucide-react";
import type { Service } from "@/content/schema";
import { MediaFrame } from "@/components/media/MediaFrame";
import { artFor, type ServiceIcon } from "@/content/service-map";
import { cn } from "@/lib/utils";

const icons: Record<ServiceIcon, typeof Sparkles> = {
  clapperboard: Clapperboard,
  sparkles: Sparkles,
  code: CodeXml,
  camera: Camera,
  video: Video,
  film: Film,
  image: Image,
  palette: Palette,
  "pen-tool": PenTool,
  brush: Brush,
  user: UserRound,
  layout: LayoutTemplate,
  megaphone: Megaphone,
  box: Box,
  wand: WandSparkles,
};

export function ServiceCard({ service, index, className }: { service: Service; index: number; className?: string }) {
  const [hover, setHover] = useState(false);
  const Icon = icons[service.icon] ?? Sparkles;
  return (
    <Link
      href={`/services/${service.slug}`}
      data-track="service_open"
      data-track-label={service.title}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={cn(
        "border-sweep group relative flex min-h-[30rem] flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-card transition-[border-color,transform] duration-500 hover:border-accent/60 sm:min-h-[34rem]",
        className,
      )}
    >
      <div className="relative h-[58%] min-h-60 overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-out)] group-hover:scale-[1.06]">
          <MediaFrame media={service.media} art={artFor(service.slug)} sizes="(min-width:1024px) 30vw, 100vw" playOnHover hovered={hover} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent transition-opacity duration-500 group-hover:opacity-70" />
        <span className="absolute left-5 top-5 font-display text-sm font-bold text-fg/70">0{index + 1}</span>
        <span className="absolute right-5 top-5 grid size-11 place-items-center rounded-full border border-white/15 bg-black/40 text-accent backdrop-blur">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>

      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <p className="eyebrow">{service.subtitle}</p>
        <h3 className="mt-3 font-display text-[1.6rem] font-bold leading-[1.05] tracking-tight transition-transform duration-500 group-hover:translate-x-1">
          {service.title}
        </h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-fg-2">{service.description}</p>
        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-fg">
            Explore service
          </span>
          <span className="grid size-12 place-items-center rounded-full border border-line text-fg transition-all duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
            <ArrowUpRight className="size-5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
