import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { storageConfigured } from "@/lib/media";
import { Card, EmptyState, PageHeader } from "@/components/admin/kit";
import { formatBytes } from "@/lib/admin/format";
import { MediaUploadPanel, NewFolder } from "./MediaClient";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  const user = await requirePage("media:view");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const type = sp.type === "IMAGE" || sp.type === "VIDEO" ? sp.type : "";
  const folder = typeof sp.folder === "string" ? sp.folder : "";
  const where: Prisma.MediaAssetWhereInput = {
    ...(type ? { type } : {}),
    ...(folder ? { folderId: folder } : {}),
    ...(q ? { OR: [{ label: { contains: q, mode: "insensitive" } }, { filename: { contains: q, mode: "insensitive" } }, { alt: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const db = requireDb();
  const [assets, folders, totals] = await Promise.all([
    db.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.mediaFolder.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { assets: true } } } }),
    db.mediaAsset.aggregate({ _sum: { size: true }, _count: true }),
  ]);
  const configured = storageConfigured();
  const canUpload = can(user.role, "media:upload");

  return (
    <>
      <PageHeader
        title="Media library"
        description={`${totals._count} file${totals._count === 1 ? "" : "s"} · ${formatBytes(totals._sum.size ?? 0)} stored`}
        actions={canUpload && configured ? <NewFolder /> : null}
      />

      {!configured ? (
        <Card title="Media storage isn't connected yet" className="mb-6 border-[#ffcc66]/40">
          <p className="text-sm text-fg-2">
            Uploads are stored in <strong>Vercel Blob</strong> (persistent storage — never the server&apos;s temporary disk). In Vercel, open the
            project → <strong>Storage</strong> → <strong>Create Database</strong> → <strong>Blob</strong>, connect it to <em>jobithlal-website</em>, then
            redeploy. Vercel adds <code>BLOB_READ_WRITE_TOKEN</code> automatically.
          </p>
        </Card>
      ) : (
        canUpload && (
          <div className="mb-6">
            <MediaUploadPanel folderId={folder || null} />
          </div>
        )
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form className="flex flex-1 flex-wrap gap-2" role="search" aria-label="Filter media">
          <input name="q" defaultValue={q} placeholder="Search by name or alt text…" className="h-10 min-w-48 flex-1 rounded-lg border border-line bg-bg-2 px-3 text-sm outline-none focus:border-accent" />
          <select name="type" defaultValue={type} aria-label="Type" className="h-10 rounded-lg border border-line bg-bg-2 px-3 text-sm">
            <option value="">All types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
          </select>
          {folder && <input type="hidden" name="folder" value={folder} />}
          <button className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-ink">Filter</button>
        </form>
      </div>

      {folders.length > 0 && (
        <nav aria-label="Folders" className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link href="/admin/media" className={`rounded-full border px-3 py-1 ${!folder ? "border-accent text-accent" : "border-line text-fg-2"}`}>
            All files
          </Link>
          {folders.map((f) => (
            <Link key={f.id} href={`/admin/media?folder=${f.id}`} className={`rounded-full border px-3 py-1 ${folder === f.id ? "border-accent text-accent" : "border-line text-fg-2"}`}>
              {f.name} <span className="text-muted">({f._count.assets})</span>
            </Link>
          ))}
        </nav>
      )}

      {assets.length === 0 ? (
        <EmptyState title={q || type || folder ? "Nothing matches" : "No media yet"}>
          {q || type || folder ? "Try a different search or folder." : configured ? "Upload images and videos above to use them across the site." : "Connect storage to start uploading."}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {assets.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/media/${a.id}`} className="group block overflow-hidden rounded-xl border border-line bg-card transition-colors hover:border-accent">
                <div className="relative aspect-square bg-bg-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails of arbitrary storage files */}
                  {(a.type === "IMAGE" || a.posterUrl) && <img src={a.type === "IMAGE" ? a.url : a.posterUrl!} alt={a.alt} loading="lazy" className="h-full w-full object-cover" />}
                  {a.type === "VIDEO" && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs">
                      <Film className="size-3" aria-hidden /> {a.duration ? `${Math.round(a.duration)}s` : "Video"}
                    </span>
                  )}
                  {!a.alt && a.type === "IMAGE" && <span className="absolute right-2 top-2 rounded bg-[#ffcc66] px-1.5 py-0.5 text-[10px] font-bold text-ink">No alt</span>}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium">{a.label ?? a.filename}</p>
                  <p className="text-xs text-muted">
                    {formatBytes(a.size)}
                    {a.width && a.height ? ` · ${a.width}×${a.height}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
