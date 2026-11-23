import "server-only";
import { requireDb } from "@/lib/db";
import type { PickedMedia } from "@/components/admin/MediaPicker";
import type { ProjectFormValues } from "./PortfolioClient";

type A = { id: string; url: string; posterUrl: string | null; type: "IMAGE" | "VIDEO"; alt: string } | null;
const pick = (a: A): PickedMedia => (a ? { id: a.id, url: a.url, posterUrl: a.posterUrl, type: a.type, alt: a.alt } : null);
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").join("\n") : "");

export async function loadProjectForm(id: string): Promise<ProjectFormValues | null> {
  const p = await requireDb().project.findUnique({
    where: { id },
    include: { cover: true, mobileCover: true, video: true, ogImage: true, gallery: { orderBy: { order: "asc" }, include: { asset: true } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    categoryId: p.categoryId,
    client: p.client ?? "",
    hideClient: p.hideClient,
    projectDate: p.projectDate ? p.projectDate.toISOString().slice(0, 10) : "",
    summary: p.summary,
    overview: p.overview,
    challenge: p.challenge ?? "",
    approach: p.approach ?? "",
    deliverables: list(p.deliverables),
    outcome: p.outcome ?? "",
    outcomeVerified: p.outcomeVerified,
    cover: pick(p.cover),
    mobileCover: pick(p.mobileCover),
    video: pick(p.video),
    externalVideoUrl: p.externalVideoUrl ?? "",
    focal: p.focal,
    tags: list(p.tags),
    featured: p.featured,
    order: p.order,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    ogImage: pick(p.ogImage),
    gallery: p.gallery.filter((g) => g.asset.type === "IMAGE").map((g) => pick(g.asset)!),
    videos: p.gallery.filter((g) => g.asset.type === "VIDEO").map((g) => ({ media: pick(g.asset)!, caption: g.caption ?? "" })),
    videoShape: p.videoShape,
    status: p.status,
    isDemo: p.isDemo,
    publicSlug: p.status === "PUBLISHED" ? p.slug : null,
  };
}

export const emptyProject = (categoryId: string, order: number): ProjectFormValues => ({
  id: null,
  title: "",
  slug: "",
  categoryId,
  client: "",
  hideClient: false,
  projectDate: "",
  summary: "",
  overview: "",
  challenge: "",
  approach: "",
  deliverables: "",
  outcome: "",
  outcomeVerified: false,
  cover: null,
  mobileCover: null,
  video: null,
  externalVideoUrl: "",
  focal: "50% 50%",
  tags: "",
  featured: false,
  order,
  seoTitle: "",
  seoDescription: "",
  ogImage: null,
  gallery: [],
  videos: [],
  videoShape: "auto",
  status: "DRAFT",
  isDemo: false,
  publicSlug: null,
});
