import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { storageConfigured } from "@/lib/media";
import { PageHeader } from "@/components/admin/kit";
import type { PickedMedia } from "@/components/admin/MediaPicker";
import { ServiceForm } from "./ServiceForm";
import { DeleteServiceButton } from "../ServicesClient";

export const metadata: Metadata = { title: "Edit service" };

type A = { id: string; url: string; posterUrl: string | null; type: "IMAGE" | "VIDEO"; alt: string } | null;
const pick = (a: A): PickedMedia => (a ? { id: a.id, url: a.url, posterUrl: a.posterUrl, type: a.type, alt: a.alt } : null);

export default async function EditService({ params }: PageProps<"/admin/services/[slug]">) {
  const user = await requirePage("content:view");
  const { slug } = await params;
  const s = await requireDb().service.findUnique({ where: { slug }, include: { image: true, video: true, ogImage: true } });
  if (!s) notFound();
  const page = (s.page ?? {}) as Record<string, unknown>;
  return (
    <>
      <PageHeader
        back={{ href: "/admin/services", label: "Services" }}
        title={s.title}
        description={
          s.enabled ? (
            <a href={`/services/${s.slug}`} target="_blank" rel="noopener" className="text-accent hover:underline">
              View /services/{s.slug} ↗
            </a>
          ) : (
            <span>Off — not on the website yet. Write the content, then switch “Enabled” on.</span>
          )
        }
        actions={can(user.role, "content:publish") ? <DeleteServiceButton slug={s.slug} title={s.title} afterDelete="/admin/services" /> : undefined}
      />
      <ServiceForm
        slug={s.slug}
        canEdit={can(user.role, "content:publish")}
        storageReady={storageConfigured()}
        v={{
          enabled: s.enabled,
          order: s.order,
          title: s.title,
          shortTitle: s.shortTitle,
          subtitle: s.subtitle,
          description: s.description,
          icon: s.icon,
          focal: s.focal,
          image: pick(s.image),
          video: pick(s.video),
          ogImage: pick(s.ogImage),
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          ctaLabel: s.ctaLabel,
          ctaHref: s.ctaHref,
          eyebrow: String(page.eyebrow ?? ""),
          headline: String(page.headline ?? ""),
          accent: String(page.accent ?? ""),
          subheading: String(page.subheading ?? ""),
          intro: String(page.intro ?? ""),
          features: (page.features as { title: string; text: string }[]) ?? [],
          process: (page.process as { title: string; text: string }[]) ?? [],
          faqs: (page.faqs as { q: string; a: string }[]) ?? [],
        }}
      />
    </>
  );
}
