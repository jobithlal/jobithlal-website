"use client";

import { saveGeneralSettings, saveSocialLinks } from "@/app/admin/actions/settings";
import { Btn, Card, Input, Toggle, useActionForm } from "@/components/admin/kit";
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

