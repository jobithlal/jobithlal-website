"use client";

import { disconnectEmail, saveEmailConnection, sendTestEmail } from "@/app/admin/actions/email";
import { saveEmailTemplate } from "@/app/admin/actions/settings";
import { Btn, Card, ConfirmButton, Input, Textarea, Toggle, useActionForm, useToast } from "@/components/admin/kit";

export type ConnectionView = {
  source: "dashboard" | "env" | null;
  apiKeyLast4: string | null;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  sendConfirmation: boolean;
  enabled: boolean;
};

export function ConnectionForm({ v, canEdit, defaultRecipient }: { v: ConnectionView; canEdit: boolean; defaultRecipient: string }) {
  const { formProps, pending, errors: e } = useActionForm(saveEmailConnection, { trackDirty: true });
  const toast = useToast();
  const stored = v.source === "dashboard";
  const fromVercel = v.source === "env";
  return (
    <Card title="Resend connection" description="Sends inquiry notifications, visitor confirmations, password resets and admin invitations.">
      <form {...formProps}>
        <fieldset disabled={!canEdit} className="space-y-4">
          <Input
            label="API key"
            name="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              stored && v.apiKeyLast4
                ? `Saved — ends in …${v.apiKeyLast4}. Leave empty to keep it.`
                : fromVercel
                  ? `Provided by Vercel${v.apiKeyLast4 ? ` (…${v.apiKeyLast4})` : ""} — leave empty`
                  : "re_…"
            }
            errors={e.apiKey}
            hint={
              <>
                Resend → API Keys → Create API key. “Full access” lets this page show your domain status; “Sending access” also works. The key is encrypted
                before it’s stored and is never shown again.
              </>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Sender email" name="fromEmail" type="email" defaultValue={v.fromEmail} placeholder="hello@jobithlal.com" errors={e.fromEmail} hint="Must be on a domain verified in Resend." />
            <Input label="Sender name" name="fromName" defaultValue={v.fromName} placeholder="JOBITHLAL" errors={e.fromName} />
          </div>
          <Input
            label="Send inquiries to"
            name="toEmail"
            type="email"
            defaultValue={v.toEmail}
            placeholder={defaultRecipient}
            errors={e.toEmail}
            hint={`Leave empty to use the business email (${defaultRecipient}).`}
          />
          <Toggle label="Email sending on" name="enabled" defaultChecked={v.enabled} hint="Turn off to pause all emails without removing the key. Inquiries are still saved in the admin." />
          <Toggle label="Send visitors a confirmation email" name="sendConfirmation" defaultChecked={v.sendConfirmation} hint="Uses the “Visitor acknowledgement” template below." />
          {canEdit && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Btn type="submit" pending={pending}>
                {stored || (fromVercel && v.fromEmail) ? "Save changes" : "Connect Resend"}
              </Btn>
              {stored && (
                <ConfirmButton
                  label="Disconnect"
                  variant="ghost"
                  title="Disconnect Resend?"
                  body="The stored API key is deleted. Inquiries keep being saved in the admin, but no emails are sent until you connect again."
                  confirmLabel="Disconnect"
                  onConfirm={async () => {
                    const r = await disconnectEmail();
                    toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
                  }}
                />
              )}
            </div>
          )}
        </fieldset>
      </form>
    </Card>
  );
}

export function TestEmailForm({ defaultTo, ready }: { defaultTo: string; ready: boolean }) {
  const { formProps, pending, errors } = useActionForm(sendTestEmail);
  return (
    <Card title="Send a test email">
      <form {...formProps} className="space-y-3">
        <Input label="Send to" name="to" type="email" defaultValue={defaultTo} errors={errors.to} />
        <Btn type="submit" pending={pending} disabled={!ready}>
          Send test
        </Btn>
        {!ready && <p className="text-xs text-muted">Connect Resend first.</p>}
      </form>
    </Card>
  );
}

export function TemplateForm({ t, canEdit }: { t: { key: string; subject: string; body: string; enabled: boolean }; canEdit: boolean }) {
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
