"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ImagePlus, Trash2 } from "lucide-react";
import {
  deleteBlogCategory,
  deleteBlogPost,
  previewBlogMarkdown,
  saveBlogCategory,
  saveBlogPost,
  saveBlogSettings,
} from "@/app/admin/actions/blog";
import { Btn, Card, ConfirmButton, Input, Select, Textarea, Toggle, useActionForm, useToast } from "@/components/admin/kit";
import { MediaPickerButton, type PickedMedia } from "@/components/admin/MediaPicker";
import type { BlogSettings } from "@/content/schema";
import { cn } from "@/lib/utils";

export type ArticleFormValues = {
  id: string | null;
  title: string;
  slug: string;
  categoryId: string;
  excerpt: string;
  content: string;
  cover: NonNullable<PickedMedia> | null;
  coverUrl: string;
  coverAlt: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string; // yyyy-mm-dd or ""
  status: "DRAFT" | "PUBLISHED";
};

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={cn("text-xs tabular-nums", value.length > max ? "text-[#ffb4a8]" : "text-muted")}>{value.length}/{max}</span>;
}

export function ArticleForm({
  v,
  categories,
  canPublish,
  storageReady,
}: {
  v: ArticleFormValues;
  categories: { id: string; name: string }[];
  canPublish: boolean;
  storageReady: boolean;
}) {
  const router = useRouter();
  const { formProps, pending, errors: e } = useActionForm(saveBlogPost.bind(null, v.id), {
    trackDirty: true,
    onSuccess: (r) => {
      if (!v.id && r.data?.id) router.push(`/admin/blog/${r.data.id}`);
    },
  });
  const [title, setTitle] = useState(v.title);
  const [slug, setSlug] = useState(v.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(v.id));
  const [excerpt, setExcerpt] = useState(v.excerpt);
  const [content, setContent] = useState(v.content);
  const [cover, setCover] = useState(v.cover);
  const [coverUrl, setCoverUrl] = useState(v.coverUrl);
  const [seoTitle, setSeoTitle] = useState(v.seoTitle);
  const [seoDesc, setSeoDesc] = useState(v.seoDescription);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, startPreview] = useTransition();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const coverSrc = cover?.url || coverUrl;
  const words = content.split(/\s+/).filter(Boolean).length;

  const insertAtCursor = (snippet: string) => {
    const el = textarea.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  return (
    <form {...formProps} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        <Card>
          <div className="space-y-4">
            <Input
              label="Title"
              name="title"
              value={title}
              onChange={(ev) => {
                setTitle(ev.target.value);
                if (!slugTouched) setSlug(toSlug(ev.target.value));
              }}
              errors={e.title}
              required
            />
            <Input
              label="Web address"
              name="slug"
              value={slug}
              onChange={(ev) => {
                setSlugTouched(true);
                setSlug(toSlug(ev.target.value));
              }}
              hint={slug ? `/blog/${slug}${v.status === "PUBLISHED" ? " — changing this breaks existing links to the article." : ""}` : "Filled in from the title."}
              errors={e.slug}
            />
            <div>
              <Textarea
                label="Excerpt"
                name="excerpt"
                rows={3}
                value={excerpt}
                onChange={(ev) => setExcerpt(ev.target.value)}
                hint="Shown on blog cards and as the article introduction under the title."
                errors={e.excerpt}
              />
              <div className="mt-1 text-right">
                <Counter value={excerpt} max={320} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Editor mode" className="inline-flex rounded-full border border-line p-1 text-sm">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => {
                    setTab(t);
                    if (t === "preview")
                      startPreview(async () => {
                        const r = await previewBlogMarkdown(content);
                        setPreviewHtml(r.ok ? (r.data?.html ?? "") : `<p>${r.error}</p>`);
                      });
                  }}
                  className={cn("rounded-full px-4 py-1.5 capitalize", tab === t ? "bg-accent font-semibold text-ink" : "text-fg-2 hover:text-fg")}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                {words} words · ~{Math.max(1, Math.round(words / 220))} min read
              </span>
              <MediaPickerButton
                title="Insert an image into the article"
                ariaLabel="Insert image"
                accept="IMAGE"
                disabled={!storageReady || tab !== "write"}
                onPick={(m) => insertAtCursor(`\n\n![${m.alt || "Describe the image"}](${m.url} "Optional caption")\n\n`)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-xs font-semibold text-fg-2 hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <ImagePlus className="size-4" aria-hidden /> Insert image
              </MediaPickerButton>
            </div>
          </div>
          <textarea
            ref={textarea}
            name="content"
            value={content}
            onChange={(ev) => setContent(ev.target.value)}
            rows={28}
            spellCheck
            aria-label="Article content (Markdown)"
            aria-invalid={Boolean(e.content)}
            className={cn("w-full rounded-lg border border-line bg-bg-2 p-4 font-mono text-sm leading-relaxed", tab !== "write" && "hidden")}
          />
          {tab === "preview" && (
            <div className="min-h-[20rem] rounded-lg border border-line bg-bg p-6">
              {previewing ? <p className="text-sm text-muted">Rendering…</p> : <div className="prose-blog" dangerouslySetInnerHTML={{ __html: previewHtml }} />}
            </div>
          )}
          {e.content && <p className="mt-2 text-xs text-[#ffb4a8]">{e.content[0]}</p>}
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer">Formatting help (Markdown)</summary>
            <ul className="mt-2 space-y-1 font-mono">
              <li>## Section heading · ### Sub-heading (appear in the table of contents)</li>
              <li>**bold** · *italic* · [link text](/contact) · [external](https://…)</li>
              <li>- bullet list · 1. numbered list · &gt; quote</li>
              <li>![alt text](image-url &quot;caption&quot;) — or use “Insert image”</li>
            </ul>
          </details>
        </Card>

        <Card title="Search engines & sharing">
          <div className="space-y-4">
            <div>
              <Input label="SEO title" name="seoTitle" value={seoTitle} onChange={(ev) => setSeoTitle(ev.target.value)} placeholder={title} hint="Leave empty to use the article title." errors={e.seoTitle} />
              <div className="mt-1 text-right">
                <Counter value={seoTitle} max={70} />
              </div>
            </div>
            <div>
              <Textarea
                label="Meta description"
                name="seoDescription"
                rows={2}
                value={seoDesc}
                onChange={(ev) => setSeoDesc(ev.target.value)}
                placeholder={excerpt}
                hint="Leave empty to use the excerpt."
                errors={e.seoDescription}
              />
              <div className="mt-1 text-right">
                <Counter value={seoDesc} max={170} />
              </div>
            </div>
            <div className="rounded-lg border border-line bg-bg-2 p-4" aria-label="Google result preview">
              <p className="truncate text-xs text-muted">jobithlal.com › blog › {slug || "…"}</p>
              <p className="mt-1 truncate text-base text-[#8ab4f8]">{seoTitle || title || "Article title"}</p>
              <p className="mt-1 line-clamp-2 text-sm text-fg-2">{seoDesc || excerpt || "Meta description"}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Publish">
          <div className="space-y-4">
            <p className="text-sm">
              Status:{" "}
              <span className={v.status === "PUBLISHED" ? "font-semibold text-accent" : "font-semibold text-fg-2"}>
                {v.status === "PUBLISHED" ? "Published" : "Draft (hidden from the website)"}
              </span>
            </p>
            <Input label="Publish date" name="publishedAt" type="date" defaultValue={v.publishedAt} hint="Shown on the article. Set automatically when first published." />
            <Toggle label="Featured article" name="featured" defaultChecked={v.featured} hint="Shown large at the top of the blog page." />
            <div className="flex flex-wrap gap-2 pt-1">
              <Btn type="submit" name="intent" value="save" pending={pending} variant={v.status === "PUBLISHED" ? "primary" : "secondary"}>
                {v.status === "PUBLISHED" ? "Save changes" : "Save draft"}
              </Btn>
              {canPublish && v.status !== "PUBLISHED" && (
                <Btn type="submit" name="intent" value="publish" variant="primary" disabled={pending}>
                  Publish
                </Btn>
              )}
              {canPublish && v.status === "PUBLISHED" && (
                <Btn type="submit" name="intent" value="unpublish" variant="ghost" disabled={pending}>
                  Unpublish
                </Btn>
              )}
            </div>
            {v.id && v.status === "PUBLISHED" && (
              <a href={`/blog/${v.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                View on the website <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
            {!canPublish && <p className="text-xs text-muted">You can save drafts. An admin with publish rights makes them live.</p>}
          </div>
        </Card>

        <Card title="Category">
          <Select
            label="Category"
            name="categoryId"
            defaultValue={v.categoryId}
            options={[{ value: "", label: "No category" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            errors={e.categoryId}
          />
        </Card>

        <Card title="Cover image" description="16:9 works best. Also used when the article is shared.">
          <input type="hidden" name="coverId" value={cover?.id ?? ""} />
          <input type="hidden" name="coverUrl" value={cover ? "" : coverUrl} />
          <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-bg-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            {coverSrc ? <img src={coverSrc} alt="" className="h-full w-full object-cover" /> : <p className="grid h-full place-items-center text-xs text-muted">No cover yet</p>}
          </div>
          {e.cover && <p className="mt-2 text-xs text-[#ffb4a8]">{e.cover[0]}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <MediaPickerButton
              title="Choose a cover image"
              accept="IMAGE"
              disabled={!storageReady}
              selectedId={cover?.id}
              onPick={(m) => setCover(m)}
              className="inline-flex h-9 items-center rounded-full border border-line px-4 text-xs font-semibold text-fg-2 hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {coverSrc ? "Replace" : "Choose image"}
            </MediaPickerButton>
            {coverSrc && (
              <Btn
                type="button"
                variant="ghost"
                className="h-9 px-4 text-xs"
                onClick={() => {
                  setCover(null);
                  setCoverUrl("");
                }}
              >
                Remove
              </Btn>
            )}
          </div>
          <div className="mt-4">
            <Input label="Cover alt text" name="coverAlt" defaultValue={v.coverAlt} hint="Describe what the image shows, for screen readers and search engines." errors={e.coverAlt} />
          </div>
        </Card>

        {v.id && canPublish && (
          <Card title="Danger zone">
            <DeleteArticleButton id={v.id} title={v.title} afterDelete="/admin/blog" />
          </Card>
        )}
      </div>
    </form>
  );
}

export function DeleteArticleButton({ id, title, afterDelete }: { id: string; title: string; afterDelete?: string }) {
  const toast = useToast();
  const router = useRouter();
  return (
    <ConfirmButton
      label="Delete"
      title={`Delete “${title}”?`}
      body="The article is removed from the website and the sitemap. This can’t be undone — unpublish instead if you may want it back."
      confirmLabel="Delete article"
      onConfirm={async () => {
        const r = await deleteBlogPost(id);
        toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "Deleted.") : r.error });
        if (r.ok && afterDelete) router.push(afterDelete);
      }}
    />
  );
}

export function BlogSettingsForm({ v, canEdit }: { v: BlogSettings; canEdit: boolean }) {
  const { formProps, pending, errors: e } = useActionForm(saveBlogSettings, { trackDirty: true });
  return (
    <Card title="Blog page" description="The blog is linked from the website footer. Switch on the header link when you’re ready.">
      <form {...formProps}>
        <fieldset disabled={!canEdit} className="space-y-4">
          <Toggle label="Show Blog in the header menu" name="showInHeader" defaultChecked={v.showInHeader} hint="Off: Blog is linked from the footer only." />
          <Input label="Eyebrow" name="heroEyebrow" defaultValue={v.heroEyebrow} errors={e.heroEyebrow} />
          <Input label="Heading" name="heroTitle" defaultValue={v.heroTitle} errors={e.heroTitle} hint="The last word or two are highlighted." />
          <Textarea label="Introduction" name="heroIntro" rows={3} defaultValue={v.heroIntro} errors={e.heroIntro} hint="Also used as the blog page’s meta description." />
          <Input label="Articles before “Load more”" name="perPage" type="number" min={3} max={24} defaultValue={v.perPage} errors={e.perPage} />
          {canEdit && (
            <Btn type="submit" variant="primary" pending={pending}>
              Save blog settings
            </Btn>
          )}
        </fieldset>
      </form>
    </Card>
  );
}

function CategoryRow({ c, canEdit }: { c: { id: string; name: string; count: number }; canEdit: boolean }) {
  const toast = useToast();
  const { formProps, pending } = useActionForm(saveBlogCategory.bind(null, c.id));
  return (
    <li className="flex items-center gap-2">
      <form {...formProps} className="flex min-w-0 flex-1 items-center gap-2">
        <input
          name="name"
          defaultValue={c.name}
          disabled={!canEdit}
          aria-label={`Category name: ${c.name}`}
          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-bg-2 px-3 text-sm"
        />
        <span className="w-16 shrink-0 text-right text-xs text-muted">{c.count} {c.count === 1 ? "post" : "posts"}</span>
        {canEdit && (
          <Btn type="submit" variant="ghost" className="h-9 px-3 text-xs" pending={pending}>
            Rename
          </Btn>
        )}
      </form>
      {canEdit && (
        <ConfirmButton
          label={<Trash2 className="size-4" aria-label={`Delete ${c.name}`} />}
          variant="ghost"
          title={`Delete “${c.name}”?`}
          body={c.count ? `Its ${c.count} article(s) stay published but become uncategorised.` : "This category has no articles."}
          confirmLabel="Delete category"
          onConfirm={async () => {
            const r = await deleteBlogCategory(c.id);
            toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
          }}
        />
      )}
    </li>
  );
}

export function CategoryManager({ categories, canEdit }: { categories: { id: string; name: string; count: number }[]; canEdit: boolean }) {
  const { formProps, pending, errors: e } = useActionForm(saveBlogCategory.bind(null, null), {
    onSuccess: () => {
      const f = document.getElementById("new-blog-category") as HTMLInputElement | null;
      if (f) f.value = "";
    },
  });
  return (
    <Card title="Categories" description="Only categories with published articles appear as filters on the blog.">
      <ul className="space-y-2">
        {categories.map((c) => (
          <CategoryRow key={c.id} c={c} canEdit={canEdit} />
        ))}
      </ul>
      {canEdit && (
        <form {...formProps} className="mt-4 flex items-start gap-2">
          <div className="flex-1">
            <Input id="new-blog-category" label="New category" name="name" placeholder="e.g. Tutorials" errors={e.name} />
          </div>
          <Btn type="submit" className="mt-7" pending={pending}>
            Add
          </Btn>
        </form>
      )}
    </Card>
  );
}
