import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getAssetUsage } from "@/lib/admin/media-usage";
import { Card, PageHeader } from "@/components/admin/kit";
import { dateFmt, formatBytes } from "@/lib/admin/format";
import { CopyUrl, MediaDetailsForm } from "../MediaClient";

export const metadata: Metadata = { title: "Media file" };

export default async function MediaAssetPage({ params }: PageProps<"/admin/media/[id]">) {
  const user = await requirePage("media:view");
  const { id } = await params;
  const db = requireDb();
  const asset = await db.mediaAsset.findUnique({ where: { id }, include: { uploadedBy: { select: { name: true } } } });
  if (!asset) notFound();
  const [usage, folders] = await Promise.all([getAssetUsage(asset), db.mediaFolder.findMany({ orderBy: { name: "asc" } })]);

  const facts: [string, string][] = [
    ["Type", asset.mimeType],
    ["Size", formatBytes(asset.size)],
    ...(asset.width && asset.height ? ([["Dimensions", `${asset.width} × ${asset.height}`]] as [string, string][]) : []),
    ...(asset.duration ? ([["Duration", `${asset.duration.toFixed(1)} s`]] as [string, string][]) : []),
    ["Uploaded", `${dateFmt.format(asset.createdAt)}${asset.uploadedBy ? ` by ${asset.uploadedBy.name}` : ""}`],
    ["File name", asset.filename],
  ];

  return (
    <>
      <PageHeader back={{ href: "/admin/media", label: "Media library" }} title={asset.label ?? asset.filename} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-line bg-bg-2">
            {asset.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview of the stored original
              <img src={asset.url} alt={asset.alt} className="mx-auto max-h-[70vh] w-auto" />
            ) : (
              <video src={asset.url} poster={asset.posterUrl ?? undefined} controls playsInline className="max-h-[70vh] w-full" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyUrl url={asset.url} />
            <input readOnly value={asset.url} aria-label="File URL" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg-2 px-3 text-xs text-fg-2" />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Card title="Details">
            <MediaDetailsForm
              id={asset.id}
              label={asset.label ?? ""}
              alt={asset.alt}
              folderId={asset.folderId}
              folders={folders}
              canEdit={can(user.role, "media:upload")}
              canDelete={can(user.role, "media:delete")}
              inUse={usage.length > 0}
            />
          </Card>
          <Card title="Where it's used">
            {usage.length === 0 ? (
              <p className="text-sm text-muted">Not used anywhere yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {usage.map((u) => (
                  <li key={u.label}>
                    <Link href={u.href} className="text-accent hover:underline">
                      {u.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="File info">
            <dl className="space-y-1.5 text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="truncate text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
