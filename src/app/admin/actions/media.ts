"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { del, head } from "@vercel/blob";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { guarded, optionalText, type ActionResult } from "@/lib/admin/action";
import { getAssetUsage } from "@/lib/admin/media-usage";
import { isBlobUrl, isVideo, maxBytesFor, sniff, storageConfigured, ALLOWED_TYPES } from "@/lib/media";

const registerSchema = z.object({
  url: z.string().url().refine(isBlobUrl, "Not a media storage URL"),
  pathname: z.string().max(300),
  filename: z.string().max(200),
  width: z.number().int().positive().max(20000).nullable().optional(),
  height: z.number().int().positive().max(20000).nullable().optional(),
  duration: z.number().positive().max(36000).nullable().optional(),
  posterUrl: z.string().url().refine(isBlobUrl).nullable().optional(),
  folderId: z.string().max(40).nullable().optional(),
});

async function readHeadBytes(url: string) {
  const res = await fetch(url, { headers: { Range: "bytes=0-63" }, cache: "no-store" });
  if (!res.ok && res.status !== 206) throw new Error(`fetch ${res.status}`);
  return new Uint8Array(await res.arrayBuffer()).slice(0, 64);
}

/** Called by the uploader after the browser finished uploading to Blob storage. */
export async function registerUpload(input: z.input<typeof registerSchema>): Promise<ActionResult<{ id: string }>> {
  return guarded("media:upload", async (user) => {
    if (!storageConfigured()) return { ok: false, error: "Media storage isn't connected yet." };
    const data = registerSchema.parse(input);
    const meta = await head(data.url);
    // Verify the real file content, not just the declared type.
    const detected = sniff(await readHeadBytes(data.url));
    const reject = async (msg: string) => {
      await del(data.url).catch(() => {});
      if (data.posterUrl) await del(data.posterUrl).catch(() => {});
      await audit("media.upload_rejected", { userId: user.id, details: { reason: msg, filename: data.filename } });
      return { ok: false as const, error: msg };
    };
    if (!detected || !ALLOWED_TYPES.includes(detected)) return reject("That file type isn't allowed. Use JPG, PNG, WebP, AVIF, GIF, MP4, WebM or MOV.");
    if (meta.size > maxBytesFor(detected)) return reject(`That file is too large (max ${maxBytesFor(detected) / 1024 / 1024} MB).`);

    const asset = await requireDb().mediaAsset.create({
      data: {
        type: isVideo(detected) ? "VIDEO" : "IMAGE",
        storageKey: meta.pathname,
        url: meta.url,
        posterUrl: data.posterUrl ?? null,
        filename: data.filename.slice(0, 200),
        label: data.filename.replace(/\.[^.]+$/, "").slice(0, 120),
        mimeType: detected,
        size: meta.size,
        width: data.width ?? null,
        height: data.height ?? null,
        duration: data.duration ?? null,
        folderId: data.folderId || null,
        uploadedById: user.id,
      },
    });
    await audit("media.uploaded", { userId: user.id, entity: "MediaAsset", entityId: asset.id, details: { type: asset.type, size: asset.size } });
    refresh();
    return { ok: true, message: "Uploaded.", data: { id: asset.id } };
  });
}

const updateSchema = z.object({
  label: optionalText(120),
  alt: z.string().trim().max(300).default(""),
  folderId: optionalText(40),
});

export async function updateMediaAsset(id: string, fd: FormData): Promise<ActionResult> {
  return guarded("media:upload", async (user) => {
    const data = updateSchema.parse(Object.fromEntries(fd));
    await requireDb().mediaAsset.update({ where: { id }, data: { label: data.label, alt: data.alt, folderId: data.folderId ?? null } });
    await audit("media.updated", { userId: user.id, entity: "MediaAsset", entityId: id });
    refresh();
    return { ok: true, message: "Media details saved." };
  });
}

export async function deleteMediaAsset(id: string): Promise<ActionResult> {
  return guarded("media:delete", async (user) => {
    const db = requireDb();
    const asset = await db.mediaAsset.findUniqueOrThrow({ where: { id } });
    const usage = await getAssetUsage(asset);
    if (usage.length) {
      return { ok: false, error: `This file is still used in ${usage.length} place${usage.length > 1 ? "s" : ""}. Replace it there first.` };
    }
    await db.mediaAsset.delete({ where: { id } });
    if (storageConfigured()) {
      await del([asset.url, ...(asset.posterUrl ? [asset.posterUrl] : [])]).catch((e) => console.error("[media] blob delete failed", e));
    }
    await audit("media.deleted", { userId: user.id, entity: "MediaAsset", entityId: id, details: { filename: asset.filename } });
    return { ok: true, message: "File deleted." };
  });
}

export async function createFolder(fd: FormData): Promise<ActionResult> {
  return guarded("media:upload", async (user) => {
    const name = z.string().trim().min(1).max(60).parse(fd.get("name"));
    const f = await requireDb().mediaFolder.create({ data: { name } });
    await audit("media.folder_created", { userId: user.id, entity: "MediaFolder", entityId: f.id });
    refresh();
    return { ok: true, message: `Folder “${name}” created.` };
  });
}

export type PickerAsset = { id: string; url: string; posterUrl: string | null; type: "IMAGE" | "VIDEO"; label: string; alt: string; width: number | null; height: number | null };

/** Read-only list for the media picker dialog. */
export async function listMedia(opts: { q?: string; type?: "IMAGE" | "VIDEO" | "" }): Promise<ActionResult<PickerAsset[]>> {
  return guarded("media:view", async () => {
    const q = (opts.q ?? "").slice(0, 80);
    const rows = await requireDb().mediaAsset.findMany({
      where: {
        ...(opts.type ? { type: opts.type } : {}),
        ...(q ? { OR: [{ label: { contains: q, mode: "insensitive" } }, { filename: { contains: q, mode: "insensitive" } }, { alt: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: { id: true, url: true, posterUrl: true, type: true, label: true, filename: true, alt: true, width: true, height: true },
    });
    return { ok: true, data: rows.map((r) => ({ ...r, label: r.label ?? r.filename })) };
  });
}
