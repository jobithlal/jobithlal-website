import Link from "next/link";
import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { storageConfigured } from "@/lib/media";
import { Card, PageHeader } from "@/components/admin/kit";
import { GeneralForm, SocialForm } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requirePage("settings:view");
  const db = requireDb();
  const [site, socials, logo] = await Promise.all([
    getSiteSettings(),
    db.socialLink.findMany({ orderBy: { order: "asc" } }),
    Promise.resolve(null),
  ]);
  const logoAsset = site.logoImageUrl ? await db.mediaAsset.findFirst({ where: { url: site.logoImageUrl } }) : logo;
  const canEdit = can(user.role, "settings:edit");
  return (
    <>
      <PageHeader title="Settings" description="Business details and social profiles." />
      <div className="space-y-6">
        <GeneralForm
          canEdit={canEdit}
          storageReady={storageConfigured()}
          v={{ ...site, logo: logoAsset ? { id: logoAsset.id, url: logoAsset.url, posterUrl: logoAsset.posterUrl, type: logoAsset.type, alt: logoAsset.alt } : null }}
        />
        <SocialForm canEdit={canEdit} links={socials.map((s) => ({ platform: s.platform, url: s.url ?? "", visible: s.visible }))} />
        <Card title="Email, search &amp; analytics">
          <p className="text-sm text-fg-2">
            Email notifications (Resend) live under <Link href="/admin/email" className="text-accent hover:underline">Email</Link>; search-engine settings under <Link href="/admin/seo" className="text-accent hover:underline">SEO</Link>; visitor tracking and reports under{" "}
            <Link href="/admin/analytics" className="text-accent hover:underline">Analytics</Link>.
          </p>
        </Card>
      </div>
    </>
  );
}
