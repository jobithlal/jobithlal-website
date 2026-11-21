import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { emailConfigured } from "@/lib/email";
import { storageConfigured } from "@/lib/media";
import { Card, PageHeader } from "@/components/admin/kit";
import { EmailSettings, GeneralForm, SocialForm } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requirePage("settings:view");
  const db = requireDb();
  const [site, socials, templates, logo] = await Promise.all([
    getSiteSettings(),
    db.socialLink.findMany({ orderBy: { order: "asc" } }),
    db.emailTemplate.findMany({ orderBy: { key: "asc" } }),
    Promise.resolve(null),
  ]);
  const logoAsset = site.logoImageUrl ? await db.mediaAsset.findFirst({ where: { url: site.logoImageUrl } }) : logo;
  const canEdit = can(user.role, "settings:edit");
  return (
    <>
      <PageHeader title="Settings" description="Business details, social profiles and email notifications." />
      <div className="space-y-6">
        <GeneralForm
          canEdit={canEdit}
          storageReady={storageConfigured()}
          v={{ ...site, logo: logoAsset ? { id: logoAsset.id, url: logoAsset.url, posterUrl: logoAsset.posterUrl, type: logoAsset.type, alt: logoAsset.alt } : null }}
        />
        <SocialForm canEdit={canEdit} links={socials.map((s) => ({ platform: s.platform, url: s.url ?? "", visible: s.visible }))} />
        <EmailSettings
          canEdit={canEdit}
          configured={emailConfigured()}
          recipient={process.env.CONTACT_TO_EMAIL || site.email}
          confirmation={process.env.CONTACT_SEND_CONFIRMATION === "true"}
          templates={templates.map((t) => ({ key: t.key, subject: t.subject, body: t.body, enabled: t.enabled }))}
        />
        <Card title="Coming in the next phase">
          <p className="text-sm text-fg-2">Design &amp; appearance, SEO manager, analytics and backup &amp; restore are part of Phase 7.</p>
        </Card>
      </div>
    </>
  );
}
