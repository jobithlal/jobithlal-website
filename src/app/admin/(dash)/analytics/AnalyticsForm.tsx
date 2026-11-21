"use client";

import { saveAnalyticsSettings } from "@/app/admin/actions/analytics";
import { Btn, Card, Input, Toggle, useActionForm } from "@/components/admin/kit";
import type { AnalyticsSettings } from "@/content/schema";

export function AnalyticsForm({ v, canEdit }: { v: AnalyticsSettings; canEdit: boolean }) {
  const { formProps, pending, errors: e } = useActionForm(saveAnalyticsSettings, { trackDirty: true });
  return (
    <Card title="Tracking setup" description="Google Analytics 4 records visits on the public website. Nothing is loaded until it is switched on.">
      <form {...formProps}>
        <fieldset disabled={!canEdit} className="space-y-5">
          <Input
            label="GA4 Measurement ID"
            name="ga4MeasurementId"
            defaultValue={v.ga4MeasurementId ?? ""}
            placeholder="G-XXXXXXXXXX"
            errors={e.ga4MeasurementId}
            hint="Google Analytics → Admin → Data streams → your web stream → Measurement ID."
            autoComplete="off"
            spellCheck={false}
          />
          <Toggle label="Enable analytics on the website" name="enabled" defaultChecked={v.enabled} />
          <Toggle
            label="Ask visitors for consent first"
            name="requireConsent"
            defaultChecked={v.requireConsent}
            hint="Recommended. Shows a small banner; GA4 runs in cookieless consent mode until the visitor accepts."
          />
          {canEdit ? (
            <Btn type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save analytics settings"}
            </Btn>
          ) : (
            <p className="text-xs text-muted">Only users who can edit settings can change this.</p>
          )}
        </fieldset>
      </form>
    </Card>
  );
}
