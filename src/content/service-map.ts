import type { ArtVariant } from "@/components/media/Artwork";

/**
 * The three original services keep their historic short codes (portfolio
 * categories and contact-form values). Services created in the admin use their
 * own slug for both.
 */
const LEGACY_CATEGORY: Record<string, string> = {
  "social-media-reels": "reels",
  "motion-graphics": "motion",
  "website-development": "websites",
};
const LEGACY_INQUIRY: Record<string, string> = {
  "social-media-reels": "reels",
  "motion-graphics": "motion",
  "website-development": "website",
};

export const categoryForService = (serviceSlug: string) => LEGACY_CATEGORY[serviceSlug] ?? serviceSlug;
export const inquiryValueForService = (serviceSlug: string) => LEGACY_INQUIRY[serviceSlug] ?? serviceSlug;

/** Placeholder artwork (shown until real media is uploaded) for a service slug or project category. */
export function artFor(key: string): ArtVariant {
  const k = LEGACY_CATEGORY[key] ?? key;
  return k === "reels" || k === "motion" || k === "websites" ? k : "portrait";
}

/** Categories whose sample projects are videos (affects the play badge only). */
export const isVideoCategory = (category: string) => category === "reels" || category === "motion";

export const SERVICE_ICONS = [
  { value: "clapperboard", label: "Clapperboard" },
  { value: "sparkles", label: "Sparkles" },
  { value: "code", label: "Code" },
  { value: "camera", label: "Camera" },
  { value: "video", label: "Video camera" },
  { value: "film", label: "Film" },
  { value: "image", label: "Image" },
  { value: "palette", label: "Palette" },
  { value: "pen-tool", label: "Pen tool" },
  { value: "brush", label: "Brush" },
  { value: "user", label: "Portrait (person)" },
  { value: "layout", label: "Layout" },
  { value: "megaphone", label: "Megaphone" },
  { value: "box", label: "Box / product" },
  { value: "wand", label: "Magic wand (AI)" },
] as const;
export type ServiceIcon = (typeof SERVICE_ICONS)[number]["value"];
export const SERVICE_ICON_VALUES = SERVICE_ICONS.map((i) => i.value) as [ServiceIcon, ...ServiceIcon[]];
