import { projectSchema, type Project, type ProjectCategory } from "./schema";

export const categoryLabels: Record<ProjectCategory, string> = {
  reels: "Social Media Reels",
  motion: "Motion Graphics",
  websites: "Websites",
};

/**
 * No real projects have been supplied yet.
 *
 * The entries below are SAMPLE LAYOUT CONTENT (isDemo: true). They contain no
 * client names, results or claims, and every public surface badges them as
 * samples. They only render while `siteSettings.showDemoProjects` is true.
 * Replace them with authentic projects from the admin portfolio manager.
 */
const demo: Project[] = [
  {
    slug: "sample-reel-layout",
    title: "Sample reel project",
    category: "reels",
    hideClient: true,
    summary: "Placeholder showing how a vertical reel project is presented.",
    overview:
      "This is a sample entry that demonstrates the project page layout. Replace it with a real reel project from the admin dashboard — add the cover, video, overview and deliverables.",
    deliverables: ["Concept", "Shoot", "Edit", "Captions", "Graphics"],
    outcomeVerified: false,
    cover: { alt: "", focal: "50% 50%" },
    gallery: [],
    featured: true,
    order: 1,
    status: "published",
    isDemo: true,
    seo: {},
  },
  {
    slug: "sample-motion-layout",
    title: "Sample motion graphics project",
    category: "motion",
    hideClient: true,
    summary: "Placeholder showing how a motion graphics project is presented.",
    overview:
      "This is a sample entry that demonstrates the project page layout. Replace it with a real motion graphics project from the admin dashboard.",
    deliverables: ["Style frames", "Animation", "Sound", "Exports"],
    outcomeVerified: false,
    cover: { alt: "", focal: "50% 50%" },
    gallery: [],
    featured: true,
    order: 2,
    status: "published",
    isDemo: true,
    seo: {},
  },
  {
    slug: "sample-website-layout",
    title: "Sample website project",
    category: "websites",
    hideClient: true,
    summary: "Placeholder showing how a website project is presented.",
    overview:
      "This is a sample entry that demonstrates the project page layout. Replace it with a real website case study from the admin dashboard.",
    deliverables: ["UI/UX design", "Development", "CMS", "Launch"],
    outcomeVerified: false,
    cover: { alt: "", focal: "50% 50%" },
    gallery: [],
    featured: true,
    order: 3,
    status: "published",
    isDemo: true,
    seo: {},
  },
  {
    slug: "sample-reel-series",
    title: "Sample reel series",
    category: "reels",
    hideClient: true,
    summary: "Placeholder for a multi-reel campaign.",
    overview:
      "This is a sample entry that demonstrates how a series of reels can be grouped into one project. Replace it with real work from the admin dashboard.",
    deliverables: ["Series plan", "Shoot", "Edits"],
    outcomeVerified: false,
    cover: { alt: "", focal: "50% 50%" },
    gallery: [],
    featured: true,
    order: 4,
    status: "published",
    isDemo: true,
    seo: {},
  },
];

/** Authentic projects go here (Phase 5: loaded from the database). */
const real: Project[] = [];

export const projects = [...real, ...demo].map((p) => projectSchema.parse(p));
