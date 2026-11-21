"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { Media } from "@/content/schema";
import { Artwork, type ArtVariant } from "./Artwork";
import { cn } from "@/lib/utils";

/**
 * Renders an uploaded video (with poster fallback) or image; otherwise designed artwork.
 * - Videos are muted, inline and only play while visible.
 * - Reduced-motion users see the poster only.
 * - `playOnHover` keeps a preview paused until the card is hovered/focused.
 */
export function MediaFrame({
  media,
  art,
  className,
  sizes = "100vw",
  priority = false,
  playOnHover = false,
  hovered = false,
  opacity = 1,
}: {
  media: Media;
  art: ArtVariant;
  className?: string;
  sizes?: string;
  priority?: boolean;
  playOnHover?: boolean;
  hovered?: boolean;
  opacity?: number;
}) {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const videoSrc = (isMobile && media.mobileVideoUrl) || media.videoUrl;
  const poster = (isMobile && media.mobileImageUrl) || media.imageUrl;
  const shouldPlay = !!videoSrc && !reduce && visible && (!playOnHover || hovered);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (shouldPlay) v.play().catch(() => {});
    else v.pause();
  }, [shouldPlay]);

  const objectPosition = media.focal;

  if (!videoSrc && !poster) return <Artwork variant={art} className={className} />;

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-bg-2", className)} style={{ opacity }}>
      {poster && (
        <Image
          src={poster}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition }}
        />
      )}
      {videoSrc && !reduce && (
        <video
          ref={videoRef}
          key={videoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition }}
          src={videoSrc}
          poster={poster}
          muted
          playsInline
          loop
          preload={priority ? "auto" : "metadata"}
          aria-hidden={!media.alt}
          aria-label={media.alt || undefined}
        />
      )}
    </div>
  );
}
