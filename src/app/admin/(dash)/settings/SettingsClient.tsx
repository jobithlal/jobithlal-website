"use client";

import { useTransition } from "react";
import { saveEmailTemplate, saveGeneralSettings, saveSocialLinks, sendTestEmail } from "@/app/admin/actions/settings";
import { Badge, Btn, Card, Input, Textarea, Toggle, useActionForm, useToast } from "@/components/admin/kit";
import { MediaField, type PickedMedia } from "@/components/admin/MediaPicker";
import type { SiteSettings } from "@/content/schema";

export function GeneralForm({ v, canEdit, storageReady }: { v: SiteSettings & { logo: PickedMedia }; canEdit: boolean; storageReady: boolean }) {
  const { formProps, pending, errors: e } = useActionForm(saveGeneralSettings, { trackDirty: true });
  return (
    <Card title="Business details">
      <form {...formProps}>
        <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Website name" name="name" defaultValue={v.name} errors={e.name} />
          <Input label="Website URL" name="url" type="url" defaultValue={v.url} errors={e.url} hint="Used for canonical links and the sitemap." />
          <Input label="Logo text" name="logoText" defaultValue={v.logoText} errors={e.logoText} />
          <Input label="Logo subtitle" name="logoSubtitle" defaultValue={v.logoSubtitle} errors={e.logoSubtitle} />
          <MediaField label="Logo image (optional)" name="logo" value={v.logo} accept="IMAGE" storageReady={storageReady} hint="Replaces the text logo. Use a wide PNG/WebP with transparency." />
          <Input label="Tagline" name="tagline" defaultValue={v.tagline} errors={e.tagline} />
          <Input label="Business email" name="email" type="email" defaultValue={v.email} errors={e.email} />
          <Input label="WhatsApp" name="whatsapp" defaultValue={v.whatsapp} errors={e.whatsapp} hint="International format, e.g. +97477350438" />
          <Input label="Location" name="location" defaultValue={v.location} errors={e.location} />
          <Input label="Years of experience" name="experienceYears" type="number" min={1} max={80} defaultValue={v.experienceYears} errors={e.experienceYears} />
          <div className="sm:col-span-2">
            <Toggle
              label="Show sample project layouts"
              name="showDemoProjects"
              defaultChecked={v.showDemoProjects}
              hint="Only while you have no real published projects. They're always labelled “Sample layout”."
            />
          </div>
        </fieldset>
        {canEdit && (
          <Btn type="submit" variant="primary" pending={pending} className="mt-5">
            Save details
          </Btn>
        )}
      </form>
    </Card>
  );
}

export function SocialForm({ links, canEdit }: { links: { platform: string; url: string; visible: boolean }[]; canEdit: boolean }) {
  const { formProps, pending, errors } = useActionForm(saveSocialLinks, { trackDirty: true });
  return (
    <Card title="Social profiles" description="Only profiles with a link appear in the footer and structured data. Never add a link you haven't checked.">
      <form {...formProps}>
        <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
          {links.map((l) => (
            <div key={l.platform} className="space-y-2">
              <Input label={l.platform} name={l.platform} type="url" placeholder={`https://…`} defaultValue={l.url} errors={errors[l.platform]} />
              <Toggle label="Show in footer" name={`${l.platform}Visible`} defaultChecked={l.visible} />
            </div>
          ))}
        </fieldset>
        {canEdit && (
          <Btn type="submit" variant="primary" pending={pending} className="mt-5">
            Save social links
          </Btn>
        )}
      </form>
    </Card>
  );
}

export function EmailSettings({
  configured,
  recipient,
  confirmation,
  templates,
  canEdit,
}: {
  configured: boolean;
  recipient: string;
  confirmation: boolean;
  templates: { key: string; subject: string; body: string; enabled: boolean }[];
  canEdit: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Card title="Email notifications">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        {configured ? <Badge tone="accent">Connected (Resend)</Badge> : <Badge tone="warn">Not connected</Badge>}
        <span className="text-fg-2">
          Inquiries go to <strong>{recipient}</strong>. Visitor confirmations are <strong>{confirmation ? "on" : "off"}</strong>.
        </span>
        {canEdit && (
          <Btn
            type="button"
            pending={pending}
            className="ml-auto"
            onClick={() =>
              start(async () => {
                const r = await sendTestEmail();
                toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
              })
            }
          >
            Send test email
          </Btn>
        )}
      </div>
      {!configured && (
        <p className="mb-4 rounded-lg bg-bg-2 p-3 text-sm text-fg-2">
          Inquiries are still saved here in the admin. To also get them by email, create a free <strong>Resend</strong> account, verify your domain, and add{" "}
          <code>RESEND_API_KEY</code> and <code>CONTACT_FROM_EMAIL</code> in Vercel → Environment Variables (optionally <code>CONTACT_TO_EMAIL</code> and{" "}
          <code>CONTACT_SEND_CONFIRMATION=true</code>), then redeploy.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((t) => (
          <TemplateForm key={t.key} t={t} canEdit={canEdit} />
        ))}
      </div>
    </Card>
  );
}

function TemplateForm({ t, canEdit }: { t: { key: string; subject: string; body: string; enabled: boolean }; canEdit: boolean }) {
  const { formProps, pending, errors } = useActionForm(saveEmailTemplate.bind(null, t.key));
  const title = t.key === "admin_inquiry" ? "New-inquiry notification (to you)" : "Visitor acknowledgement";
  return (
    <form {...formProps} className="space-y-3 rounded-lg bg-bg-2 p-4">
      <p className="font-semibold">{title}</p>
      <fieldset disabled={!canEdit} className="space-y-3">
        <Input label="Subject" name="subject" defaultValue={t.subject} errors={errors.subject} />
        <Textarea label="Message" name="body" rows={5} defaultValue={t.body} errors={errors.body} hint="Placeholders: {{name}} {{firstName}} {{email}} {{service}} {{details}}" />
        <Toggle label="Enabled" name="enabled" defaultChecked={t.enabled} />
      </fieldset>
      {canEdit && (
        <Btn type="submit" pending={pending}>
          Save template
        </Btn>
      )}
    </form>
  );
}
