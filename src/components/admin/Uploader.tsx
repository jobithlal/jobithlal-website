"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { UploadCloud } from "lucide-react";
import { registerUpload } from "@/app/admin/actions/media";
import { ALLOWED_TYPES, extFor, isVideo, maxBytesFor, safeStem } from "@/lib/media";
import { useToast } from "./kit";
import { cn } from "@/lib/utils";

type Job = { name: string; pct: number; state: "uploading" | "verifying" | "done" | "error"; msg?: string };

function monthPath() {
  const d = new Date();
  return `media/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type Meta = { width?: number; height?: number; duration?: number; poster?: Blob };

async function imageMeta(file: File): Promise<Meta> {
  try {
    const bmp = await createImageBitmap(file);
    const r = { width: bmp.width, height: bmp.height };
    bmp.close();
    return r;
  } catch {
    return {};
  }
}

/** Reads a video's size/duration and grabs a poster frame (~1 s in). */
function videoMeta(file: File): Promise<Meta> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.src = url;
    const done = (r: Meta) => {
      URL.revokeObjectURL(url);
      resolve(r);
    };
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    };
    v.onseeked = () => {
      const c = document.createElement("canvas");
      const scale = Math.min(1, 1920 / (v.videoWidth || 1920));
      c.width = Math.round(v.videoWidth * scale);
      c.height = Math.round(v.videoHeight * scale);
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(
        (b) => done({ width: v.videoWidth, height: v.videoHeight, duration: v.duration, poster: b ?? undefined }),
        "image/jpeg",
        0.82,
      );
    };
    v.onerror = () => done({});
    setTimeout(() => done({}), 15000);
  });
}

export function Uploader({ folderId, onUploaded, compact }: { folderId?: string | null; onUploaded?: (id: string) => void; compact?: boolean }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const set = (i: number, j: Partial<Job>) => setJobs((all) => all.map((x, k) => (k === i ? { ...x, ...j } : x)));

  async function handle(files: FileList | File[]) {
    const list = Array.from(files);
    const start = jobs.length;
    setJobs((all) => [...all, ...list.map((f) => ({ name: f.name, pct: 0, state: "uploading" as const }))]);
    for (const [n, file] of list.entries()) {
      const i = start + n;
      if (!ALLOWED_TYPES.includes(file.type)) {
        set(i, { state: "error", msg: "Unsupported type" });
        continue;
      }
      if (file.size > maxBytesFor(file.type)) {
        set(i, { state: "error", msg: `Too large (max ${maxBytesFor(file.type) / 1024 / 1024} MB)` });
        continue;
      }
      try {
        const meta: Meta = isVideo(file.type) ? await videoMeta(file) : await imageMeta(file);
        const base = `${monthPath()}/${safeStem(file.name)}`;
        const blob = await upload(`${base}.${extFor(file.type)}`, file, {
          access: "public",
          handleUploadUrl: "/admin/media/upload",
          contentType: file.type,
          multipart: file.size > 50 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => set(i, { pct: Math.round(percentage) }),
        });
        let posterUrl: string | null = null;
        if (meta.poster) {
          const p = await upload(`${base}-poster.jpg`, meta.poster, { access: "public", handleUploadUrl: "/admin/media/upload", contentType: "image/jpeg" });
          posterUrl = p.url;
        }
        set(i, { state: "verifying", pct: 100 });
        const r = await registerUpload({
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          width: meta.width ?? null,
          height: meta.height ?? null,
          duration: meta.duration && isFinite(meta.duration) ? meta.duration : null,
          posterUrl,
          folderId: folderId ?? null,
        });
        if (r.ok) {
          set(i, { state: "done" });
          if (r.data) onUploaded?.(r.data.id);
        } else set(i, { state: "error", msg: r.error });
      } catch (e) {
        set(i, { state: "error", msg: e instanceof Error ? e.message : "Upload failed" });
      }
    }
    const failed = list.length; // summary toast
    toast({ tone: "success", text: `Finished ${failed} upload${failed > 1 ? "s" : ""}.` });
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors",
          compact ? "p-5" : "p-8",
          drag ? "border-accent bg-accent/5" : "border-line",
        )}
      >
        <UploadCloud className="size-6 text-accent" aria-hidden />
        <p className="text-sm">
          Drag files here or{" "}
          <button type="button" onClick={() => input.current?.click()} className="font-semibold text-accent underline-offset-4 hover:underline">
            browse
          </button>
        </p>
        <p className="text-xs text-muted">JPG, PNG, WebP, AVIF, GIF up to 20 MB · MP4, WebM, MOV up to 500 MB</p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) handle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {jobs.map((j, i) => (
            <li key={i} className="rounded-lg bg-bg-2 px-3 py-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate">{j.name}</span>
                <span className={cn("shrink-0 text-xs", j.state === "error" ? "text-[#ffb4a8]" : j.state === "done" ? "text-accent" : "text-muted")}>
                  {j.state === "uploading" ? `${j.pct}%` : j.state === "verifying" ? "Verifying…" : j.state === "done" ? "Done" : j.msg}
                </span>
              </div>
              {j.state === "uploading" && (
                <div className="mt-1.5 h-1 overflow-hidden rounded bg-line">
                  <div className="h-full bg-accent transition-all" style={{ width: `${j.pct}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
