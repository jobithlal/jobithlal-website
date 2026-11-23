"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Film, Plus, Star, X } from "lucide-react";
import { deleteProject, moveProject, saveProject, toggleFeatured } from "@/app/admin/actions/portfolio";
import { Btn, Card, ConfirmButton, Input, Select, Textarea, Toggle, useActionForm, useToast } from "@/components/admin/kit";
import { MediaField, MediaPickerButton, type PickedMedia } from "@/components/admin/MediaPicker";
import { parseVideoLink } from "@/lib/video-embed";

export function ProjectRowControls({ id, featured, first, last, reorderable }: { id: string; featured: boolean; first: boolean; last: boolean; reorderable: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = (p: Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await p;
      if (!r.ok || r.message) toast({ tone: r.ok ? "success" : "error", text: (r.ok ? r.message : r.error) ?? "" });
    });
  return (
    <div className="flex items-center gap-1">
      <Btn type="button" variant="ghost" className="h-9 px-2" aria-label={featured ? "Remove from homepage" : "Show on homepage"} aria-pressed={featured} disabled={pending} onClick={() => run(toggleFeatured(id, !featured))}>
        <Star className={featured ? "size-4 fill-accent text-accent" : "size-4"} />
      </Btn>
      {reorderable && (
        <>
          <Btn type="button" variant="ghost" className="h-9 px-2" aria-label="Move up" disabled={first || pending} onClick={() => run(moveProject(id, "up"))}>
            <ArrowUp className="size-4" />
          </Btn>
          <Btn type="button" variant="ghost" className="h-9 px-2" aria-label="Move down" disabled={last || pending} onClick={() => run(moveProject(id, "down"))}>
            <ArrowDown className="size-4" />
          </Btn>
        </>
      )}
    </div>
  );
}

export type ProjectFormValues = {
  id: string | null;
  title: string;
  slug: string;
  categoryId: string;
  client: string;
  hideClient: boolean;
  projectDate: string;
  summary: string;
  overview: string;
  challenge: string;
  approach: string;
  deliverables: string;
  outcome: string;
  outcomeVerified: boolean;
  cover: PickedMedia;
  mobileCover: PickedMedia;
  video: PickedMedia;
  externalVideoUrl: string;
  focal: string;
  tags: string;
  featured: boolean;
  order: number;
  seoTitle: string;
  seoDescription: string;
  ogImage: PickedMedia;
  gallery: NonNullable<PickedMedia>[];
  videos: VideoEntry[];
  videoShape: string;
  status: "DRAFT" | "PUBLISHED";
  isDemo: boolean;
  publicSlug: string | null;
};

/** A project video: an uploaded file or a YouTube/Vimeo link. */
export type VideoEntry =
  | { kind: "file"; media: NonNullable<PickedMedia>; caption: string }
  | { kind: "link"; url: string; thumb: string | null; caption: string };
const entryKey = (x: VideoEntry) => (x.kind === "file" ? x.media.id : x.url);

export function ProjectForm({
  v,
  categories,
  canPublish,
  storageReady,
}: {
  v: ProjectFormValues;
  categories: { id: string; label: string }[];
  canPublish: boolean;
  storageReady: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [gallery, setGallery] = useState(v.gallery);
  const [videos, setVideos] = useState(v.videos);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const addLink = () => {
    const parsed = parseVideoLink(linkInput);
    if (!parsed) return setLinkError("Paste a YouTube or Vimeo video link, e.g. https://youtu.be/… or https://vimeo.com/…");
    const url = linkInput.trim();
    if (videos.some((x) => x.kind === "link" && parseVideoLink(x.url)?.embedUrl === parsed.embedUrl)) return setLinkError("That video is already in the list.");
    setVideos((a) => [...a, { kind: "link", url, thumb: parsed.thumbnailUrl ?? null, caption: "" }]);
    setLinkInput("");
    setLinkError(null);
  };
  const moveVideo = (i: number, d: -1 | 1) =>
    setVideos((a) => {
      const b = [...a];
      [b[i], b[i + d]] = [b[i + d], b[i]];
      return b;
    });
  const { formProps, pending, errors } = useActionForm(saveProject.bind(null, v.id), {
    trackDirty: true,
    onSuccess: (r) => {
      if (!v.id && r.data) router.replace(`/admin/portfolio/${r.data.id}`);
    },
  });
  const e = errors;

  return (
    <form {...formProps} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {v.isDemo && (
          <p className="rounded-lg border border-dashed border-[#ffcc66]/50 p-3 text-sm text-fg-2">
            This is a <strong>sample layout</strong>. Saving it turns it into a real project — replace the placeholder text and add your own media first, or delete it.
          </p>
        )}
        <Card title="Project">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label="Title" name="title" defaultValue={v.title} errors={e.title} required />
            <Input label="URL slug" name="slug" defaultValue={v.slug} errors={e.slug} hint="Leave empty to create it from the title. Appears as /work/your-slug." />
            <Select label="Category" name="categoryId" defaultValue={v.categoryId} errors={e.categoryId} options={categories.map((c) => ({ value: c.id, label: c.label }))} />
            <Input label="Client" name="client" defaultValue={v.client} errors={e.client} />
            <Input label="Project date" name="projectDate" type="date" defaultValue={v.projectDate} errors={e.projectDate} />
            <div className="sm:col-span-2">
              <Toggle label="Hide the client name on the website" name="hideClient" defaultChecked={v.hideClient} hint="For confidential projects." />
            </div>
          </div>
        </Card>
        <Card title="Story">
          <div className="space-y-4">
            <Textarea label="Short summary" name="summary" rows={2} defaultValue={v.summary} errors={e.summary} hint="Shown on project cards (max 300 characters)." />
            <Textarea label="Overview" name="overview" rows={5} defaultValue={v.overview} errors={e.overview} />
            <Textarea label="The challenge" name="challenge" rows={4} defaultValue={v.challenge} errors={e.challenge} />
            <Textarea label="Creative approach" name="approach" rows={4} defaultValue={v.approach} errors={e.approach} />
            <Textarea label="Deliverables" name="deliverables" rows={3} defaultValue={v.deliverables} errors={e.deliverables} hint="One per line (or separated by commas)." />
            <Textarea label="Outcome" name="outcome" rows={3} defaultValue={v.outcome} errors={e.outcome} />
            <Toggle
              label="Outcome is verified"
              name="outcomeVerified"
              defaultChecked={v.outcomeVerified}
              hint="The outcome is only shown publicly when this is on. Only include results you can stand behind."
            />
          </div>
        </Card>
        <Card title="Media">
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaField label="Cover image" name="coverId" value={v.cover} accept="IMAGE" storageReady={storageReady} />
            <MediaField label="Mobile cover (optional)" name="mobileCoverId" value={v.mobileCover} accept="IMAGE" storageReady={storageReady} />
            <MediaField label="Video (plays on hover & on the page)" name="videoId" value={v.video} accept="VIDEO" storageReady={storageReady} />
            <Input label="YouTube / Vimeo link (optional)" name="externalVideoUrl" defaultValue={v.externalVideoUrl} errors={e.externalVideoUrl} hint="Embedded on the project page instead of the cover." />
            <Input label="Focal point" name="focal" defaultValue={v.focal} errors={e.focal} hint="Which part of the cover stays visible when cropped, e.g. 50% 30%." />
          </div>
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-fg-2">Image gallery</p>
            {gallery.map((g, i) => (
              <input key={`${g.id}-${i}`} type="hidden" name="gallery" value={g.id} />
            ))}
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {gallery.map((g, i) => (
                <li key={g.id} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-bg-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  {(g.type === "IMAGE" || g.posterUrl) && <img src={g.type === "IMAGE" ? g.url : g.posterUrl!} alt="" className="h-full w-full object-cover" />}
                  <div className="absolute inset-x-1 bottom-1 flex justify-between">
                    <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => setGallery((a) => { const b = [...a]; [b[i - 1], b[i]] = [b[i], b[i - 1]]; return b; })} className="grid size-7 place-items-center rounded bg-black/70 disabled:opacity-30">
                      <ArrowUp className="size-3.5 -rotate-90" />
                    </button>
                    <button type="button" aria-label="Remove from gallery" onClick={() => setGallery((a) => a.filter((x) => x.id !== g.id))} className="grid size-7 place-items-center rounded bg-black/70">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
              <li className="aspect-square">
                <MediaPickerButton
                  title="Add images to the gallery"
                  ariaLabel="Add images to gallery"
                  accept="IMAGE"
                  disabled={!storageReady}
                  onPickMany={(ms) => setGallery((a) => [...a, ...ms.filter((m) => !a.some((x) => x.id === m.id))])}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  <Plus className="size-5" aria-hidden /> Add
                </MediaPickerButton>
              </li>
            </ul>
          </div>
        </Card>
        <Card
          title="Videos"
          description="Add as many videos as you like for this client. They're shown three per row on the project page, each with a play button."
        >
          {videos.map((x) => (
            <span key={`${entryKey(x)}-h`}>
              {/* Uploaded files submit their id; links submit the URL. */}
              <input type="hidden" name="videoItem" value={x.kind === "file" ? x.media.id : x.url} />
              <input type="hidden" name="videoCaption" value={x.caption} />
            </span>
          ))}
          {videos.length > 0 && (
            <ul className="mb-4 space-y-2">
              {videos.map((x, i) => (
                <li key={entryKey(x)} className="flex items-center gap-3 rounded-lg border border-line bg-bg-2 p-2">
                  <span className="w-6 shrink-0 text-center text-xs text-muted">{i + 1}</span>
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-black">
                    {(() => {
                      const thumb = x.kind === "file" ? x.media.posterUrl : x.thumb;
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      return thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <Film className="absolute inset-0 m-auto size-5 text-muted" />;
                    })()}
                    {x.kind === "link" && (
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/75 px-1 text-[9px] font-bold uppercase text-white">
                        {parseVideoLink(x.url)?.provider === "vimeo" ? "Vimeo" : "YouTube"}
                      </span>
                    )}
                  </div>
                  <input
                    value={x.caption}
                    onChange={(ev) => setVideos((a) => a.map((y, j) => (j === i ? { ...y, caption: ev.target.value } : y)))}
                    maxLength={200}
                    placeholder={x.kind === "file" ? x.media.alt || x.media.url.split("/").pop() || "Caption (optional)" : `Caption (optional) — ${x.url.replace(/^https?:\/\/(www\.)?/, "")}`}
                    aria-label={`Caption for video ${i + 1}`}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm"
                  />
                  <div className="flex shrink-0 gap-1">
                    <Btn type="button" variant="ghost" className="h-8 px-2" aria-label="Move up" disabled={i === 0} onClick={() => moveVideo(i, -1)}>
                      <ArrowUp className="size-4" />
                    </Btn>
                    <Btn type="button" variant="ghost" className="h-8 px-2" aria-label="Move down" disabled={i === videos.length - 1} onClick={() => moveVideo(i, 1)}>
                      <ArrowDown className="size-4" />
                    </Btn>
                    <Btn type="button" variant="ghost" className="h-8 px-2" aria-label={`Remove video ${i + 1}`} onClick={() => setVideos((a) => a.filter((_, j) => j !== i))}>
                      <X className="size-4" />
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-end gap-4">
            <MediaPickerButton
              title="Add videos"
              ariaLabel="Add videos to this project"
              accept="VIDEO"
              disabled={!storageReady}
              onPickMany={(ms) =>
                setVideos((a) => [
                  ...a,
                  ...ms.filter((m) => !a.some((x) => x.kind === "file" && x.media.id === m.id)).map((m): VideoEntry => ({ kind: "file", media: m, caption: "" })),
                ])
              }
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-dashed border-line px-5 text-sm font-semibold text-fg-2 hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden /> Upload or choose videos
            </MediaPickerButton>
            <div className="w-56">
              <Select
                label="Video shape"
                name="videoShape"
                defaultValue={v.videoShape}
                options={[
                  { value: "auto", label: "Automatic (from first video)" },
                  { value: "portrait", label: "Vertical 9:16 (Reels)" },
                  { value: "square", label: "Square 1:1" },
                  { value: "landscape", label: "Landscape 16:9" },
                ]}
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="video-link" className="mb-1.5 block text-sm font-medium text-fg-2">
              Or add a YouTube / Vimeo link
            </label>
            <div className="flex gap-2">
              <input
                id="video-link"
                value={linkInput}
                onChange={(ev) => {
                  setLinkInput(ev.target.value);
                  setLinkError(null);
                }}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    addLink();
                  }
                }}
                placeholder="https://youtube.com/shorts/…  or  https://vimeo.com/…"
                inputMode="url"
                aria-invalid={Boolean(linkError)}
                aria-describedby={linkError ? "video-link-error" : undefined}
                className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-bg-2 px-3 text-sm"
              />
              <Btn type="button" onClick={addLink} disabled={!linkInput.trim()}>
                Add link
              </Btn>
            </div>
            {linkError && (
              <p id="video-link-error" className="mt-1.5 text-xs text-[#ffb4a8]">
                {linkError}
              </p>
            )}
            <p className="mt-1.5 text-xs text-muted">Works with YouTube videos and Shorts, and Vimeo (including unlisted links). Visitors play them on your page.</p>
          </div>
          {!storageReady && <p className="mt-2 text-xs text-muted">Connect media storage to upload videos — links work without it.</p>}
        </Card>
        <Card title="Search & sharing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="SEO title" name="seoTitle" defaultValue={v.seoTitle} errors={e.seoTitle} hint="Up to ~60 characters. Defaults to the project title." />
            <MediaField label="Social share image" name="ogImageId" value={v.ogImage} accept="IMAGE" storageReady={storageReady} />
            <Textarea className="sm:col-span-2" label="Meta description" name="seoDescription" rows={2} defaultValue={v.seoDescription} errors={e.seoDescription} hint="Up to ~160 characters. Defaults to the summary." />
            <Textarea className="sm:col-span-2" label="Tags" name="tags" rows={2} defaultValue={v.tags} hint="Internal tags, one per line or comma-separated." />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="sticky top-20 space-y-6">
          <Card title="Publishing">
            <p className="mb-4 text-sm text-fg-2">
              Status: <strong className={v.status === "PUBLISHED" ? "text-accent" : ""}>{v.status === "PUBLISHED" ? "Published" : "Draft"}</strong>
            </p>
            <div className="space-y-4">
              <Toggle label="Feature on the homepage" name="featured" defaultChecked={v.featured} />
              <Input label="Sort order" name="order" type="number" min={0} defaultValue={v.order} errors={e.order} hint="Lower numbers appear first." />
            </div>
            <div className="mt-5 grid gap-2">
              <Btn type="submit" name="intent" value="save" pending={pending}>
                {v.status === "PUBLISHED" ? "Save changes" : "Save draft"}
              </Btn>
              {canPublish &&
                (v.status === "PUBLISHED" ? (
                  <Btn type="submit" name="intent" value="unpublish" variant="ghost" pending={pending}>
                    Unpublish
                  </Btn>
                ) : (
                  <Btn type="submit" name="intent" value="publish" variant="primary" pending={pending}>
                    Publish
                  </Btn>
                ))}
              {v.id && (
                <a href={`/admin/preview/project/${v.id}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center justify-center rounded-lg border border-line text-sm font-semibold hover:border-fg-2/50">
                  Preview ↗
                </a>
              )}
              <Btn type="button" variant="ghost" onClick={() => router.push("/admin/portfolio")}>
                Cancel
              </Btn>
            </div>
            {!canPublish && <p className="mt-3 text-xs text-muted">Your role can save drafts. A Super Admin or Editor publishes.</p>}
          </Card>
          {v.id && canPublish && (
            <Card title="Danger zone">
              <ConfirmButton
                label="Delete project"
                title="Delete this project?"
                body="The project page is removed. Its images and videos stay in the media library."
                onConfirm={async () => {
                  const r = await deleteProject(v.id!);
                  if (r.ok) {
                    toast({ tone: "success", text: r.message ?? "Deleted." });
                    router.push("/admin/portfolio");
                  } else toast({ tone: "error", text: r.error });
                }}
              />
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
