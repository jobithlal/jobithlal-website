"use client";

import { motion } from "motion/react";
import type { Media } from "@/content/schema";
import { MediaFrame } from "@/components/media/MediaFrame";
import type { ArtVariant } from "@/components/media/Artwork";
import { cn } from "@/lib/utils";

/** Masked image reveal: clip-path wipes upward while the image settles from a slight zoom. */
export function RevealImage({ media, art = "portrait", className }: { media: Media; art?: ArtVariant; className?: string }) {
  return (
    <motion.div
      className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-line", className)}
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      whileInView={{ clipPath: "inset(0% 0 0 0)" }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.2 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <MediaFrame media={media} art={art} sizes="(min-width:1024px) 33vw, 100vw" />
      </motion.div>
    </motion.div>
  );
}
