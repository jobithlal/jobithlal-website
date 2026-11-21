"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { saveSeoSettings } from "@/app/admin/actions/seo";
import { Badge, Btn, Card, Input, Textarea, Toggle, useActionForm } from "@/components/admin/kit";
import { MediaField, type PickedMedia } from "@/components/admin/MediaPicker";
import type { SeoSettings } from "@/content/schema";
import { cn } from "@/lib/utils";

type PageDef = { path: string; label: string; defaults: { title: string; description: string } };

/** Approximates Google's result snippet so the admin can judge length and wording. */
function SnippetPreview({ url, title, description }: { url: string; title: string; description: string }) {
  const t = title.length > 60 ? `${title.slice(0, 58)}…` : title;
  const d = description.length > 160 ? `${description.slice(0, 157)}…` : description;
  return (
    <div className="rounded-lg bg-white p-4 font-sans text-left" aria-label="Search result preview">
      <p className="truncate text-xs text-[#4d5156]">{url}</p>
      <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{t || "—"}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">{d || "—"}</p>
    </div>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={cn("text-xs", value.length > max ? "text-[#ffb4a8]" : "text-muted")}>{value.length}/{max}</span>;
}

export function SeoForm({
  seo,
  media,
  pages,
  canEdit,
  storageReady,
}: {
  seo: SeoSettings;
  media: Record<string, PickedMedia>;
  pages: PageDef[];
  canEdit: boolean;
  storageReady: boolean;
}) {
  const { formProps, pending, errors: e } = useActionForm(saveSeoSettings, { trackDirty: true });
  const [title, setTitle] = useState(seo.defaultTitle);
  const [desc, setDesc] = useState(seo.defaultDescription);
  const [domain, setDomain] = useState(seo.canonicalDomain);
  const m = (u?: string) => (u ? (media[u] ?? null) : null);

  return (
    <form {...formProps} className="grid gap-6 lg:grid-cols-3">
      <fieldset disabled={!canEdit} className="min-w-0 space-y-6 lg:col-span-2">
        <Card title="Site-wide defaults" description="Used on the homepage and wherever a page has no override.">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Site name" name="siteName" defaultValue={seo.siteName} errors={e.siteName} hint="Appended to page titles: “Page | Site name”." />
              <Input label="Canonical domain" name="canonicalDomain" type="url" value={domain} onChange={(ev) => setDomain(ev.target.value)} errors={e.canonicalDomain} hint="The one official address, e.g. https://www.jobithlal.com" />
            </div>
            <div>
              <div className="flex justify-end">
                <Counter value={title} max={60} />
              </div>
              <Input label="Default title" name="defaultTitle" value={title} onChange={(ev) => setTitle(ev.target.value)} errors={e.defaultTitle} />
            </div>
            <div>
              <div className="flex justify-end">
                <Counter value={desc} max={160} />
              </div>
              <Textarea label="Default meta description" name="defaultDescription" rows={3} value={desc} onChange={(ev) => setDesc(ev.target.value)} errors={e.defaultDescription} />
            </div>
            <SnippetPreview url={domain.replace(/^https?:\/\//, "")} title={title} description={desc} />
            <MediaField
              label="Default social share image"
              name="shareImage"
              value={m(seo.shareImageUrl)}
              accept="IMAGE"
              storageReady={storageReady}
              hint="Shown when a link is shared on WhatsApp, LinkedIn, X, etc. Ideal size 1200×630. Without one, a branded image is generated automatically."
            />
          </div>
        </Card>

        <Card title="Pages" description="Override the title, description and share image for individual pages. Leave fields empty to use each page's built-in text.">
          <ul className="space-y-2">
            {pages.map((p, i) => (
              <PageRow key={p.path} i={i} def={p} value={seo.pages[p.path]} domain={domain} siteName={seo.siteName} errors={e} media={m(seo.pages[p.path]?.ogImageUrl)} storageReady={storageReady} />
            ))}
          </ul>
        </Card>
      </fieldset>

      <div>
        <div className="sticky top-20 space-y-6">
          <Card title="Search engines">
            <fieldset disabled={!canEdit} className="space-y-4">
              <Toggle
                label="Allow search engines to index the site"
                name="allowIndexing"
                defaultChecked={seo.allowIndexing}
                hint="Turn off only while the site is not ready to be found. It sets noindex on every page and blocks crawlers in robots.txt."
              />
              <Input label="Google Search Console verification" name="google" defaultValue={seo.verification.google ?? ""} hint="Paste the HTML-tag code (or the whole <meta> tag)." />
              <Input label="Bing Webmaster verification" name="bing" defaultValue={seo.verification.bing ?? ""} hint="Paste the msvalidate.01 code (or the whole tag)." />
            </fieldset>
            {canEdit ? (
              <Btn type="submit" variant="primary" pending={pending} className="mt-5 w-full">
                Save SEO settings
              </Btn>
            ) : (
              <p className="mt-4 text-xs text-muted">Only a Super Admin can change SEO settings.</p>
            )}
          </Card>
          <Card title="Built in automatically">
            <ul className="space-y-1.5 text-sm text-fg-2">
              <li>✓ XML sitemap and robots.txt</li>
              <li>✓ Canonical URLs on every page</li>
              <li>✓ Open Graph and X (Twitter) cards</li>
              <li>✓ Structured data: business, person, website, services, FAQs, breadcrumbs</li>
              <li>✓ Sample projects and drafts kept out of search</li>
            </ul>
          </Card>
        </div>
      </div>
    </form>
  );
}

function PageRow({
  i,
  def,
  value,
  domain,
  siteName,
  errors,
  media,
  storageReady,
}: {
  i: number;
  def: PageDef;
  value?: SeoSettings["pages"][string];
  domain: string;
  siteName: string;
  errors: Record<string, string[] | undefined>;
  media: PickedMedia;
  storageReady: boolean;
}) {
  const hasErr = Object.keys(errors).some((k) => k.startsWith(`pages.${i}.`));
  const [open, setOpen] = useState(hasErr);
  const [title, setTitle] = useState(value?.title ?? "");
  const [desc, setDesc] = useState(value?.description ?? "");
  const overridden = Boolean(value && (value.title || value.description || value.ogImageUrl || value.ogTitle || value.ogDescription));
  const effTitle = title || def.defaults.title;
  const n = (f: string) => `pages.${i}.${f}`;
  return (
    <li className="rounded-lg border border-line bg-bg-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open || hasErr} className="flex w-full items-center gap-3 p-3 text-left">
        <span className="font-medium">{def.label}</span>
        <span className="text-xs text-muted">{def.path}</span>
        <span className="ml-auto flex gap-2">
          {overridden && <Badge tone="accent">Custom</Badge>}
          {value?.noindex && <Badge tone="warn">Noindex</Badge>}
        </span>
        <ChevronDown className={cn("size-4 transition-transform", (open || hasErr) && "rotate-180")} aria-hidden />
      </button>
      {/* Kept mounted (hidden) so values submit even when collapsed. */}
      <div className={cn("space-y-4 border-t border-line p-4", !(open || hasErr) && "hidden")}>
        <div>
          <div className="flex justify-end">
            <Counter value={title} max={60} />
          </div>
          <Input label="SEO title" name={n("title")} value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder={def.defaults.title || "Uses the site default title"} errors={errors[n("title")]} />
        </div>
        <div>
          <div className="flex justify-end">
            <Counter value={desc} max={160} />
          </div>
          <Textarea label="Meta description" name={n("description")} rows={2} value={desc} onChange={(ev) => setDesc(ev.target.value)} placeholder={def.defaults.description || "Uses the site default description"} errors={errors[n("description")]} />
        </div>
        <SnippetPreview
          url={`${domain.replace(/^https?:\/\//, "")}${def.path === "/" ? "" : def.path}`}
          title={def.path === "/" && !title ? "" : effTitle ? `${effTitle} | ${siteName}` : ""}
          description={desc || def.defaults.description}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Social share title" name={n("ogTitle")} defaultValue={value?.ogTitle ?? ""} placeholder="Defaults to the SEO title" errors={errors[n("ogTitle")]} />
          <Input label="Social share description" name={n("ogDescription")} defaultValue={value?.ogDescription ?? ""} placeholder="Defaults to the meta description" errors={errors[n("ogDescription")]} />
        </div>
        <MediaField label="Social share image" name={n("ogImage")} value={media} accept="IMAGE" storageReady={storageReady} />
        <Toggle label="Hide this page from search engines (noindex)" name={n("noindex")} defaultChecked={value?.noindex ?? false} />
      </div>
    </li>
  );
}
