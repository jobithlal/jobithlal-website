"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveService } from "@/app/admin/actions/services";
import { Btn, Card, Input, Select, Textarea, Toggle, useActionForm } from "@/components/admin/kit";
import { MediaField, type PickedMedia } from "@/components/admin/MediaPicker";
import { SERVICE_ICONS } from "@/content/service-map";

type Row = Record<string, string>;
type V = {
  enabled: boolean;
  order: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  icon: string;
  focal: string;
  image: PickedMedia;
  video: PickedMedia;
  ogImage: PickedMedia;
  seoTitle: string;
  seoDescription: string;
  ctaLabel: string;
  ctaHref: string;
  eyebrow: string;
  headline: string;
  accent: string;
  subheading: string;
  intro: string;
  features: { title: string; text: string }[];
  process: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
};

export function ServiceForm({ slug, v, canEdit, storageReady }: { slug: string; v: V; canEdit: boolean; storageReady: boolean }) {
  const router = useRouter();
  const { formProps, pending, errors } = useActionForm(saveService.bind(null, slug), { trackDirty: true });
  const e = errors;
  return (
    <form {...formProps} className="grid gap-6 lg:grid-cols-3">
      <fieldset disabled={!canEdit} className="min-w-0 space-y-6 lg:col-span-2">
        <Card title="Homepage card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" name="title" defaultValue={v.title} errors={e.title} />
            <Input label="Short title" name="shortTitle" defaultValue={v.shortTitle} errors={e.shortTitle} hint="Used in the footer and filters." />
            <Input label="Subtitle" name="subtitle" defaultValue={v.subtitle} errors={e.subtitle} />
            <Select label="Icon" name="icon" defaultValue={v.icon} options={SERVICE_ICONS.map((i) => ({ value: i.value, label: i.label }))} />
            <Textarea className="sm:col-span-2" label="Description" name="description" rows={3} defaultValue={v.description} errors={e.description} />
            <MediaField label="Card image" name="image" value={v.image} accept="IMAGE" storageReady={storageReady} />
            <MediaField label="Card video (plays on hover)" name="video" value={v.video} accept="VIDEO" storageReady={storageReady} />
            <Input label="Focal point" name="focal" defaultValue={v.focal} errors={e["media.focal"]} />
          </div>
        </Card>
        <Card title="Landing page">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Eyebrow" name="eyebrow" defaultValue={v.eyebrow} errors={e.eyebrow} />
            <Input label="Headline" name="headline" defaultValue={v.headline} errors={e.headline} />
            <Input label="Green ending" name="accent" defaultValue={v.accent} errors={e.accent} />
            <Textarea className="sm:col-span-2" label="Subheading" name="subheading" rows={2} defaultValue={v.subheading} errors={e.subheading} />
            <Textarea className="sm:col-span-2" label="Intro" name="intro" rows={4} defaultValue={v.intro} errors={e.intro} />
          </div>
        </Card>
        <Rows title="What's included" prefix="features" fields={[["title", "Feature"], ["text", "Short description"]]} initial={v.features} max={20} />
        <Rows title="Process steps" prefix="process" fields={[["title", "Step"], ["text", "Description"]]} initial={v.process} max={8} />
        <Rows title="FAQ" prefix="faqs" fields={[["q", "Question"], ["a", "Answer"]]} initial={v.faqs} max={15} long />
        <Card title="Search, sharing & call to action">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="SEO title" name="seoTitle" defaultValue={v.seoTitle} errors={e.seoTitle} />
            <MediaField label="Social share image" name="ogImage" value={v.ogImage} accept="IMAGE" storageReady={storageReady} />
            <Textarea className="sm:col-span-2" label="Meta description" name="seoDescription" rows={2} defaultValue={v.seoDescription} errors={e.seoDescription} />
            <Input label="Button label" name="ctaLabel" defaultValue={v.ctaLabel} errors={e.ctaLabel} />
            <Input label="Button link" name="ctaHref" defaultValue={v.ctaHref} errors={e.ctaHref} hint="e.g. /contact?service=reels pre-selects the service in the form." />
          </div>
        </Card>
      </fieldset>
      <div>
        <div className="sticky top-20">
          <Card title="Publishing">
            {canEdit ? (
              <div className="space-y-4">
                <Toggle label="Enabled" name="enabled" defaultChecked={v.enabled} hint="Disabled services are hidden everywhere on the site." />
                <Input label="Order" name="order" type="number" min={0} defaultValue={v.order} />
                <div className="grid gap-2">
                  <Btn type="submit" variant="primary" pending={pending}>
                    Save &amp; publish
                  </Btn>
                  <Btn type="button" variant="ghost" onClick={() => router.push("/admin/services")}>
                    Cancel
                  </Btn>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Your role can view services but not change them.</p>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}

function Rows({ title, prefix, fields, initial, max, long }: { title: string; prefix: string; fields: [string, string][]; initial: Row[]; max: number; long?: boolean }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const edit = (i: number, k: string, val: string) => setRows((a) => a.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRows((a) => {
      const b = [...a];
      [b[i], b[i + d]] = [b[i + d], b[i]];
      return b;
    });
  return (
    <Card title={title}>
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="rounded-lg bg-bg-2 p-3">
            <div className="mb-2 flex items-center justify-end gap-1">
              <Btn type="button" variant="ghost" className="h-8 px-2" aria-label={`Move ${title} item ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="size-4" />
              </Btn>
              <Btn type="button" variant="ghost" className="h-8 px-2" aria-label={`Move ${title} item ${i + 1} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="size-4" />
              </Btn>
              <Btn type="button" variant="ghost" className="h-8 px-2" aria-label={`Remove ${title} item ${i + 1}`} onClick={() => setRows((a) => a.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Btn>
            </div>
            <div className={long ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
              {fields.map(([k, label], fi) =>
                long && fi === 1 ? (
                  <Textarea key={k} label={label} name={`${prefix}.${i}.${k}`} rows={3} value={r[k] ?? ""} onChange={(ev) => edit(i, k, ev.target.value)} />
                ) : (
                  <Input key={k} label={label} name={`${prefix}.${i}.${k}`} value={r[k] ?? ""} onChange={(ev) => edit(i, k, ev.target.value)} />
                ),
              )}
            </div>
          </li>
        ))}
      </ol>
      {rows.length < max && (
        <Btn type="button" className="mt-3" onClick={() => setRows((a) => [...a, Object.fromEntries(fields.map(([k]) => [k, ""]))])}>
          <Plus className="size-4" aria-hidden /> Add
        </Btn>
      )}
    </Card>
  );
}
