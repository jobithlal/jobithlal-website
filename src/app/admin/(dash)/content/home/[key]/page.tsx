import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { storageConfigured } from "@/lib/media";
import { SECTION_LABELS } from "@/lib/admin/sections";
import { buildHomeBundle } from "@/lib/content";
import { PageHeader } from "@/components/admin/kit";
import type { PickedMedia } from "@/components/admin/MediaPicker";
import { SectionForm } from "./SectionForm";

export const metadata: Metadata = { title: "Edit section" };

export default async function EditSectionPage({ params }: PageProps<"/admin/content/home/[key]">) {
  const user = await requirePage("content:view");
  const { key } = await params;
  if (!SECTION_LABELS[key]) notFound();
  const db = requireDb();
  const page = await db.page.findUnique({ where: { slug: "home" }, include: { sections: true } });
  const section = page?.sections.find((s) => s.key === key);
  if (!section) notFound();

  // Draft if there is one, otherwise the live content — validated (falls back to defaults if invalid).
  const hasDraft = section.draftData !== null;
  const bundle = buildHomeBundle([{ key, data: hasDraft ? section.draftData : section.publishedData, visible: section.visible }]);
  const data =
    key === "hero" ? bundle.hero : key === "ticker" ? bundle.ticker : (bundle.home as Record<string, unknown>)[key];

  // Resolve stored media URLs back to library items for the pickers.
  const urls = JSON.stringify(data).match(/https:\/\/[^"]+\.public\.blob\.vercel-storage\.com[^"]*/g) ?? [];
  const assets = urls.length ? await db.mediaAsset.findMany({ where: { OR: [{ url: { in: urls } }, { posterUrl: { in: urls } }] } }) : [];
  const media: Record<string, PickedMedia> = {};
  for (const a of assets) {
    const m = { id: a.id, url: a.url, posterUrl: a.posterUrl, type: a.type, alt: a.alt };
    media[a.url] = m;
    if (a.posterUrl) media[a.posterUrl] = m;
  }

  return (
    <>
      <PageHeader
        back={{ href: "/admin/content/home", label: "Homepage" }}
        title={SECTION_LABELS[key]}
        description={hasDraft ? "You're editing an unpublished draft. The live site still shows the published version." : "Editing the published version. Save a draft to stage changes, or publish directly."}
      />
      <SectionForm
        sectionKey={key}
        data={data as Record<string, unknown>}
        media={media}
        hasDraft={hasDraft}
        canEdit={can(user.role, "content:edit")}
        canPublish={can(user.role, "content:publish")}
        storageReady={storageConfigured()}
      />
    </>
  );
}
