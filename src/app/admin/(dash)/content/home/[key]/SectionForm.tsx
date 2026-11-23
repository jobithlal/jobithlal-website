"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { discardDraft, saveSection } from "@/app/admin/actions/content";
import { Btn, Card, ConfirmButton, Input, Select, Textarea, Toggle, useActionForm, useToast } from "@/components/admin/kit";
import { MediaField, type PickedMedia } from "@/components/admin/MediaPicker";

type D = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const o = (v: unknown) => (v && typeof v === "object" ? (v as D) : {});
const arr = (v: unknown) => (Array.isArray(v) ? (v as D[]) : []);

const VALUE_ICONS = ["target", "layers", "cpu", "zap"].map((v) => ({ value: v, label: v }));
const STEP_ICONS = ["message", "target", "zap", "send"].map((v) => ({ value: v, label: v }));

export function SectionForm({
  sectionKey,
  data,
  media,
  hasDraft,
  canEdit,
  canPublish,
  storageReady,
}: {
  sectionKey: string;
  data: D;
  media: Record<string, PickedMedia>;
  hasDraft: boolean;
  canEdit: boolean;
  canPublish: boolean;
  storageReady: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { formProps, pending, errors } = useActionForm(saveSection.bind(null, sectionKey), { trackDirty: true });
  const err = (k: string) => errors[k];
  const m = (url: unknown) => (typeof url === "string" ? (media[url] ?? null) : null);

  let fields: ReactNode = null;
  switch (sectionKey) {
    case "hero": {
      const med = o(data.media);
      const lines = arr(data.lines) as unknown as string[];
      fields = (
        <>
          <Card title="Text">
            <div className="space-y-4">
              <Input label="Eyebrow" name="eyebrow" defaultValue={s(data.eyebrow)} errors={err("eyebrow")} />
              {[0, 1, 2, 3].map((i) => (
                <Input key={i} label={`Headline line ${i + 1}${i === 3 ? " (optional)" : ""}`} name={`lines.${i}`} defaultValue={s(lines[i])} errors={err(`lines.${i}`) ?? (i === 0 ? err("lines") : undefined)} />
              ))}
              <Select
                label="Line shown in green"
                name="accentLine"
                defaultValue={String(data.accentLine ?? 2)}
                options={[0, 1, 2, 3].map((i) => ({ value: String(i), label: `Line ${i + 1}` }))}
              />
              <Textarea label="Description" name="description" rows={3} defaultValue={s(data.description)} errors={err("description")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Primary button label" name="primaryCta.label" defaultValue={s(o(data.primaryCta).label)} errors={err("primaryCta.label")} />
                <Input label="Primary button link" name="primaryCta.href" defaultValue={s(o(data.primaryCta).href)} errors={err("primaryCta.href")} hint="e.g. /contact or /#work" />
                <Input label="Secondary button label" name="secondaryCta.label" defaultValue={s(o(data.secondaryCta).label)} errors={err("secondaryCta.label")} />
                <Input label="Secondary button link" name="secondaryCta.href" defaultValue={s(o(data.secondaryCta).href)} errors={err("secondaryCta.href")} />
              </div>
            </div>
          </Card>
          <Card title="Background media" description="Video is muted, plays inline, pauses off-screen and is skipped for visitors who prefer reduced motion. The image is the poster/fallback.">
            <div className="grid gap-4 sm:grid-cols-2">
              <MediaField label="Desktop image / poster" name="heroImage" value={m(med.imageUrl)} accept="IMAGE" storageReady={storageReady} />
              <MediaField label="Desktop video" name="heroVideo" value={m(med.videoUrl)} accept="VIDEO" storageReady={storageReady} />
              <MediaField label="Mobile image / poster" name="heroMobileImage" value={m(med.mobileImageUrl)} accept="IMAGE" storageReady={storageReady} />
              <MediaField label="Mobile video" name="heroMobileVideo" value={m(med.mobileVideoUrl)} accept="VIDEO" storageReady={storageReady} />
              <Input label="Alt text" name="mediaAlt" defaultValue={s(med.alt)} hint="Leave empty if the media is purely decorative." />
              <Input label="Focal point" name="focal" defaultValue={s(med.focal) || "60% 50%"} errors={err("media.focal")} hint="The hero frame is portrait (4:5) — use a portrait image or video. The focal point keeps the subject in view, e.g. 50% 30%." />
              <Input label="Media opacity (%)" name="mediaOpacity" type="number" min={0} max={100} defaultValue={Math.round(Number(data.mediaOpacity ?? 0.85) * 100)} />
              {/* The hero image now sits in its own frame beside the text, so no overlay is needed; the stored value is kept. */}
              <input type="hidden" name="overlayStrength" value={Math.round(Number(data.overlayStrength ?? 0.85) * 100)} />
              <Toggle label="Autoplay video" name="autoplay" defaultChecked={Boolean(data.autoplay)} />
              <Toggle label="Loop video" name="loop" defaultChecked={Boolean(data.loop)} />
            </div>
          </Card>
        </>
      );
      break;
    }
    case "ticker":
      fields = (
        <Card title="Ticker">
          <div className="space-y-4">
            <Toggle label="Show the ticker" name="enabled" defaultChecked={Boolean(data.enabled)} />
            <Textarea label="Items" name="items" rows={4} defaultValue={(arr(data.items) as unknown as string[]).join("\n")} errors={err("items")} hint="One per line." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Seconds per loop" name="durationSeconds" type="number" min={5} max={120} defaultValue={String(data.durationSeconds ?? 28)} errors={err("durationSeconds")} hint="Lower = faster." />
              <Select label="Direction" name="direction" defaultValue={s(data.direction) || "left"} options={[{ value: "left", label: "Right to left" }, { value: "right", label: "Left to right" }]} />
            </div>
          </div>
        </Card>
      );
      break;
    case "services":
    case "work":
      fields = (
        <Card title="Text">
          <div className="space-y-4">
            <Input label="Eyebrow" name="eyebrow" defaultValue={s(data.eyebrow)} errors={err("eyebrow")} />
            <Input label="Heading" name="heading" defaultValue={s(data.heading)} errors={err("heading")} />
            <Textarea label="Description" name="description" rows={3} defaultValue={s(data.description)} errors={err("description")} />
            <p className="text-xs text-muted">{sectionKey === "services" ? "Service cards are edited under Services." : "Project cards come from the Portfolio (featured projects)."}</p>
          </div>
        </Card>
      );
      break;
    case "difference": {
      const values = arr(data.values);
      fields = (
        <>
          <Card title="Statement">
            <div className="space-y-4">
              <Input label="Eyebrow" name="eyebrow" defaultValue={s(data.eyebrow)} errors={err("eyebrow")} />
              <Textarea label="Heading lines" name="headingLines" rows={2} defaultValue={(arr(data.headingLines) as unknown as string[]).join("\n")} hint="One line per row." errors={err("headingLines")} />
              <Input label="Green ending" name="accent" defaultValue={s(data.accent)} errors={err("accent")} />
              <Textarea label="Supporting copy" name="body" rows={4} defaultValue={s(data.body)} errors={err("body")} />
              <MediaField label="Portrait" name="portrait" value={m(o(data.portrait).imageUrl)} accept="IMAGE" storageReady={storageReady} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Portrait alt text" name="portraitAlt" defaultValue={s(o(data.portrait).alt)} />
                <Input label="Portrait focal point" name="portraitFocal" defaultValue={s(o(data.portrait).focal) || "50% 30%"} />
              </div>
            </div>
          </Card>
          <Card title="Four value propositions">
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 rounded-lg bg-bg-2 p-3">
                  <Input label={`Title ${i + 1}`} name={`values.${i}.title`} defaultValue={s(values[i]?.title)} errors={err(`values.${i}.title`)} />
                  <Textarea label="Text" name={`values.${i}.text`} rows={2} defaultValue={s(values[i]?.text)} errors={err(`values.${i}.text`)} />
                  <Select label="Icon" name={`values.${i}.icon`} defaultValue={s(values[i]?.icon) || "target"} options={VALUE_ICONS} />
                </div>
              ))}
            </div>
          </Card>
          <StatsEditor initial={arr(data.stats)} />
        </>
      );
      break;
    }
    case "process":
      fields = (
        <>
          <Card title="Heading">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Eyebrow" name="eyebrow" defaultValue={s(data.eyebrow)} errors={err("eyebrow")} />
              <Input label="Heading" name="heading" defaultValue={s(data.heading)} errors={err("heading")} />
            </div>
          </Card>
          <StepsEditor initial={arr(data.steps)} errors={errors} />
        </>
      );
      break;
    case "finalCta":
      fields = (
        <Card title="Call to action">
          <div className="space-y-4">
            <Input label="Headline" name="heading" defaultValue={s(data.heading)} errors={err("heading")} />
            <Input label="Lead line" name="lead" defaultValue={s(data.lead)} errors={err("lead")} />
            <Textarea label="Body" name="body" rows={4} defaultValue={s(data.body)} errors={err("body")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Button label" name="cta.label" defaultValue={s(o(data.cta).label)} errors={err("cta.label")} />
              <Input label="Button link" name="cta.href" defaultValue={s(o(data.cta).href)} errors={err("cta.href")} />
            </div>
          </div>
        </Card>
      );
      break;
    case "contact":
      fields = (
        <Card title="Contact section" description="Email, WhatsApp and location come from Settings.">
          <div className="space-y-4">
            <Input label="Heading" name="heading" defaultValue={s(data.heading)} errors={err("heading")} />
            <Input label="Green ending" name="accent" defaultValue={s(data.accent)} errors={err("accent")} />
            <Textarea label="Description" name="description" rows={3} defaultValue={s(data.description)} errors={err("description")} />
          </div>
        </Card>
      );
      break;
  }

  return (
    <form {...formProps} className="grid gap-6 lg:grid-cols-3">
      <fieldset disabled={!canEdit} className="min-w-0 space-y-6 lg:col-span-2">
        {fields}
      </fieldset>
      <div>
        <div className="sticky top-20 space-y-3">
          <Card title="Save">
            {canEdit ? (
              <div className="grid gap-2">
                <Btn type="submit" name="intent" value="draft" pending={pending}>
                  Save draft
                </Btn>
                {canPublish && (
                  <Btn type="submit" name="intent" value="publish" variant="primary" pending={pending}>
                    Publish this section
                  </Btn>
                )}
                <a href="/admin/preview/home" target="_blank" rel="noopener" className="inline-flex h-10 items-center justify-center rounded-lg border border-line text-sm font-semibold hover:border-fg-2/50">
                  Preview with drafts ↗
                </a>
                {hasDraft && (
                  <ConfirmButton
                    label="Discard draft"
                    variant="ghost"
                    title="Discard this draft?"
                    body="Your unpublished changes to this section are removed. The live version is unchanged."
                    confirmLabel="Discard"
                    onConfirm={async () => {
                      const r = await discardDraft(sectionKey);
                      toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
                      if (r.ok) router.refresh();
                    }}
                  />
                )}
                <Btn type="button" variant="ghost" onClick={() => router.push("/admin/content/home")}>
                  Cancel
                </Btn>
              </div>
            ) : (
              <p className="text-sm text-muted">Your role can view content but not edit it.</p>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}

function StatsEditor({ initial }: { initial: D[] }) {
  const [rows, setRows] = useState(() => initial.map((r) => ({ value: s(r.value), label: s(r.label), verified: Boolean(r.verified) })));
  const edit = (i: number, k: "value" | "label", v: string) => setRows((a) => a.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <Card title="Statistics" description="Only statistics marked as verified are shown. Never add figures you can't back up.">
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid items-end gap-3 rounded-lg bg-bg-2 p-3 sm:grid-cols-[8rem_1fr_auto_auto]">
            <Input label="Value" name={`stats.${i}.value`} value={r.value} onChange={(e) => edit(i, "value", e.target.value)} placeholder="16+" />
            <Input label="Label" name={`stats.${i}.label`} value={r.label} onChange={(e) => edit(i, "label", e.target.value)} />
            <label className="flex h-10 items-center gap-2 text-sm">
              <input type="hidden" name={`stats.${i}.verified`} value={r.verified ? "true" : "false"} />
              <input
                type="checkbox"
                checked={r.verified}
                onChange={(e) => setRows((a) => a.map((x, j) => (j === i ? { ...x, verified: e.target.checked } : x)))}
                className="size-4 accent-[var(--accent)]"
              />
              Verified
            </label>
            <Btn type="button" variant="ghost" className="h-10 px-2" aria-label={`Remove statistic ${i + 1}`} onClick={() => setRows((a) => a.filter((_, k) => k !== i))}>
              <Trash2 className="size-4" />
            </Btn>
          </div>
        ))}
        {rows.length < 6 && (
          <Btn type="button" onClick={() => setRows((a) => [...a, { value: "", label: "", verified: false }])}>
            <Plus className="size-4" aria-hidden /> Add statistic
          </Btn>
        )}
      </div>
    </Card>
  );
}

function StepsEditor({ initial, errors }: { initial: D[]; errors: Record<string, string[] | undefined> }) {
  // Controlled rows so typed text survives reordering.
  const [rows, setRows] = useState(() => initial.map((r) => ({ title: s(r.title), text: s(r.text), icon: s(r.icon) || "message" })));
  const edit = (i: number, k: "title" | "text" | "icon", v: string) => setRows((a) => a.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRows((a) => {
      const b = [...a];
      [b[i], b[i + d]] = [b[i + d], b[i]];
      return b;
    });
  return (
    <Card title="Steps">
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="space-y-3 rounded-lg bg-bg-2 p-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex gap-1">
                <Btn type="button" variant="ghost" className="h-8 px-2" aria-label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="size-4" />
                </Btn>
                <Btn type="button" variant="ghost" className="h-8 px-2" aria-label={`Move step ${i + 1} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="size-4" />
                </Btn>
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
              <Input label="Title" name={`steps.${i}.title`} value={r.title} onChange={(e) => edit(i, "title", e.target.value)} errors={errors[`steps.${i}.title`]} />
              <Select label="Icon" name={`steps.${i}.icon`} value={r.icon} onChange={(e) => edit(i, "icon", e.target.value)} options={STEP_ICONS} />
            </div>
            <Textarea label="Description" name={`steps.${i}.text`} rows={2} value={r.text} onChange={(e) => edit(i, "text", e.target.value)} errors={errors[`steps.${i}.text`]} />
          </li>
        ))}
      </ol>
    </Card>
  );
}
