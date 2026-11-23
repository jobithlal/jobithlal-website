"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Film, ImageIcon, X } from "lucide-react";
import { listMedia, type PickerAsset } from "@/app/admin/actions/media";
import { Btn } from "./kit";
import { Uploader } from "./Uploader";
import { cn } from "@/lib/utils";

export type PickedMedia = { id: string; url: string; posterUrl: string | null; type: "IMAGE" | "VIDEO"; alt: string } | null;

/** A button that opens the media library (with upload) and returns the chosen file. */
export function MediaPickerButton({
  onPick,
  accept = "any",
  title = "Choose media",
  selectedId,
  disabled,
  className,
  children,
  ariaLabel,
  onPickMany,
}: {
  onPick?: (m: NonNullable<PickedMedia>) => void;
  /** Multi-select mode: tick several files (and files uploaded here are ticked automatically). */
  onPickMany?: (m: NonNullable<PickedMedia>[]) => void;
  accept?: "IMAGE" | "VIDEO" | "any";
  title?: string;
  selectedId?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<PickerAsset[]>([]);
  const [q, setQ] = useState("");
  const [loading, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const multi = Boolean(onPickMany);
  const [selected, setSelected] = useState<string[]>([]);
  const toPicked = (a: PickerAsset): NonNullable<PickedMedia> => ({ id: a.id, url: a.url, posterUrl: a.posterUrl, type: a.type, alt: a.alt });
  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const load = (query: string) =>
    start(async () => {
      const r = await listMedia({ q: query, type: accept === "any" ? "" : accept });
      if (r.ok) {
        setItems(r.data ?? []);
        setError(null);
      } else setError(r.error);
    });

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      load("");
    } else dialog.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per open
  }, [open]);

  return (
    <>
      <button type="button" disabled={disabled} aria-label={ariaLabel} className={className} onClick={() => {
          setSelected([]);
          setOpen(true);
        }}>
        {children}
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-auto h-[min(44rem,calc(100vh-2rem))] w-[min(56rem,calc(100vw-2rem))] rounded-xl border border-line bg-card p-0 text-fg backdrop:bg-black/70"
        aria-label={title}
      >
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <div className="ml-auto flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      load(q);
                    }
                  }}
                  placeholder="Search…"
                  aria-label="Search media"
                  className="h-9 w-44 rounded-lg border border-line bg-bg-2 px-3 text-sm"
                />
                <Btn type="button" className="h-9" onClick={() => load(q)}>
                  Search
                </Btn>
                <Btn type="button" variant="ghost" className="h-9 px-2" aria-label="Close" onClick={() => setOpen(false)}>
                  <X className="size-4" />
                </Btn>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Uploader
                compact
                onUploaded={(id) => {
                  if (multi) setSelected((cur) => (cur.includes(id) ? cur : [...cur, id]));
                  load("");
                }}
              />
              {error && <p className="mt-4 text-sm text-[#ffb4a8]">{error}</p>}
              {loading && items.length === 0 ? (
                <p className="mt-6 text-sm text-muted">Loading…</p>
              ) : items.length === 0 ? (
                <p className="mt-6 text-sm text-muted">No matching files — upload one above.</p>
              ) : (
                <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {items.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        aria-pressed={multi ? selected.includes(a.id) : undefined}
                        onClick={() => {
                          if (multi) return toggle(a.id);
                          onPick?.(toPicked(a));
                          setOpen(false);
                        }}
                        className={cn(
                          "group relative block w-full overflow-hidden rounded-lg border text-left hover:border-accent",
                          selectedId === a.id || selected.includes(a.id) ? "border-accent ring-2 ring-accent" : "border-line",
                        )}
                      >
                        {multi && (
                          <span
                            aria-hidden
                            className={cn(
                              "absolute left-1.5 top-1.5 z-10 grid size-6 place-items-center rounded-full border text-[11px] font-bold",
                              selected.includes(a.id) ? "border-accent bg-accent text-ink" : "border-white/60 bg-black/50 text-transparent",
                            )}
                          >
                            {selected.includes(a.id) ? selected.indexOf(a.id) + 1 : ""}
                          </span>
                        )}
                        <span className="relative block aspect-square bg-bg-2">
                          {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
                          {(a.type === "IMAGE" || a.posterUrl) && <img src={a.type === "IMAGE" ? a.url : a.posterUrl!} alt="" className="h-full w-full object-cover" loading="lazy" />}
                          {a.type === "VIDEO" && <Film className="absolute bottom-1.5 right-1.5 size-4 text-white drop-shadow" aria-hidden />}
                        </span>
                        <span className="block truncate px-2 py-1.5 text-xs">{a.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {multi && (
              <div className="flex items-center justify-between gap-3 border-t border-line p-4">
                <p className="text-sm text-fg-2">{selected.length ? `${selected.length} selected — added in this order` : "Tick the files to add, or upload new ones above."}</p>
                <Btn
                  type="button"
                  variant="primary"
                  disabled={!selected.length}
                  onClick={() => {
                    const byId = new Map(items.map((a) => [a.id, a]));
                    onPickMany?.(selected.map((id) => byId.get(id)).filter(Boolean).map((a) => toPicked(a!)));
                    setOpen(false);
                  }}
                >
                  Add {selected.length || ""} {selected.length === 1 ? "file" : "files"}
                </Btn>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

/**
 * A single media form field. Submits the asset id as `name`, plus `${name}Url`
 * and `${name}Poster` for content stored as structured JSON.
 */
export function MediaField({
  label,
  name,
  value,
  accept = "any",
  hint,
  disabled,
  storageReady = true,
}: {
  label: string;
  name: string;
  value: PickedMedia;
  accept?: "IMAGE" | "VIDEO" | "any";
  hint?: string;
  disabled?: boolean;
  storageReady?: boolean;
}) {
  const [picked, setPicked] = useState<PickedMedia>(value);
  const thumb = picked && (picked.type === "IMAGE" ? picked.url : picked.posterUrl);
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-fg-2">{label}</p>
      <input type="hidden" name={name} value={picked?.id ?? ""} />
      <input type="hidden" name={`${name}Url`} value={picked?.url ?? ""} />
      <input type="hidden" name={`${name}Poster`} value={picked?.posterUrl ?? ""} />
      <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-2 p-2">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : accept === "VIDEO" ? <Film className="size-5 text-muted" /> : <ImageIcon className="size-5 text-muted" />}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          {picked ? <p className="truncate text-fg-2">{picked.alt || picked.url.split("/").pop()}</p> : <p className="text-muted">None — designed artwork is shown instead.</p>}
        </div>
        {!disabled && (
          <div className="flex gap-1">
            <MediaPickerButton
              onPick={setPicked}
              accept={accept}
              title={`Choose ${label.toLowerCase()}`}
              selectedId={picked?.id}
              disabled={!storageReady}
              className="inline-flex h-8 items-center rounded-lg border border-line bg-bg px-3 text-xs font-semibold hover:border-fg-2/50 disabled:opacity-50"
            >
              {picked ? "Change" : "Choose"}
            </MediaPickerButton>
            {picked && (
              <Btn type="button" variant="ghost" className="h-8 px-2" aria-label={`Remove ${label}`} onClick={() => setPicked(null)}>
                <X className="size-4" />
              </Btn>
            )}
          </div>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {!storageReady && <p className="mt-1 text-xs text-muted">Connect media storage to choose files.</p>}
    </div>
  );
}
