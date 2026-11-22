import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { checkResendKey, getEmailConfig } from "@/lib/email";
import { secretBoxReady } from "@/lib/secret-box";
import { dateFmt } from "@/lib/admin/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/admin/kit";
import { emailStatusLabels } from "../inquiries/labels";
import { ConnectionForm, TemplateForm, TestEmailForm } from "./EmailClient";

export const metadata: Metadata = { title: "Email" };

const statusTone = { SENT: "accent", FAILED: "danger", PENDING: "warn", NOT_CONFIGURED: "muted", SKIPPED: "muted" } as const;

export default async function EmailPage() {
  const user = await requirePage("settings:view");
  const canEdit = can(user.role, "settings:edit");
  const db = requireDb();
  const [cfg, site, templates, log] = await Promise.all([
    getEmailConfig(),
    getSiteSettings(),
    db.emailTemplate.findMany({ orderBy: { key: "asc" } }),
    db.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, name: true, createdAt: true, adminEmailStatus: true, adminEmailError: true, visitorEmailStatus: true },
    }),
  ]);
  // Live domain status from Resend (only full-access keys can read it).
  const check = canEdit && cfg.apiKey ? await checkResendKey(cfg.apiKey) : null;
  const connected = Boolean(cfg.apiKey && cfg.fromEmail);
  const fromDomain = cfg.fromEmail?.split("@")[1];

  return (
    <>
      <PageHeader title="Email" description="Resend delivers your website’s emails. Inquiries are always saved in the admin, even when email is off." />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {connected && cfg.enabled ? <Badge tone="accent">Connected</Badge> : connected ? <Badge tone="warn">Paused</Badge> : <Badge tone="muted">Not connected</Badge>}
          {cfg.source === "env" && <Badge tone="neutral">API key from Vercel</Badge>}
          {connected && <span className="text-fg-2">Sending as <strong>{cfg.fromName ? `${cfg.fromName} <${cfg.fromEmail}>` : cfg.fromEmail}</strong> → inquiries to <strong>{cfg.toEmail || site.email}</strong></span>}
        </div>

        {cfg.keyUnreadable && (
          <p className="rounded-lg border border-[#ffb4a8]/40 bg-bg-2 p-3 text-sm text-[#ffb4a8]">
            The stored API key can’t be decrypted — AUTH_SECRET was probably changed. Paste the key again below.
          </p>
        )}
        {!secretBoxReady() && canEdit && cfg.source !== "env" && (
          <p className="rounded-lg border border-line bg-bg-2 p-3 text-sm text-fg-2">
            To store an API key here, the server needs an <code className="text-fg">AUTH_SECRET</code> environment variable (32+ random characters) in Vercel. Add it and redeploy.
          </p>
        )}
        {cfg.source === "env" && (
          <p className="rounded-lg bg-bg-2 p-3 text-sm text-fg-2">
            The Resend API key comes from Vercel (<code className="text-fg">RESEND_API_KEY</code>, added by the Resend integration). Leave the key field empty and just set the sender below.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <ConnectionForm
              canEdit={canEdit}
              defaultRecipient={site.email}
              v={{
                source: cfg.source,
                apiKeyLast4: cfg.apiKeyLast4,
                fromEmail: cfg.fromEmail ?? "",
                fromName: cfg.fromName || "JOBITHLAL",
                toEmail: cfg.toEmail ?? "",
                sendConfirmation: cfg.sendConfirmation,
                enabled: cfg.enabled,
              }}
            />
          </div>
          <div className="space-y-6">
            {canEdit && <TestEmailForm defaultTo={user.email} ready={connected} />}
            <Card title="Sending domains">
              {!connected ? (
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-fg-2">
                  <li>
                    Create a free account at{" "}
                    <a href="https://resend.com" target="_blank" rel="noopener" className="text-accent hover:underline">resend.com ↗</a>.
                  </li>
                  <li>Domains → Add domain → jobithlal.com, then add the DNS records it shows at your DNS provider.</li>
                  <li>When it shows Verified, create an API key and paste it here.</li>
                </ol>
              ) : !check ? (
                <p className="text-sm text-muted">Only users who can edit settings see domain status.</p>
              ) : !check.ok ? (
                <p className="text-sm text-[#ffb4a8]">Resend: {check.error}</p>
              ) : check.restricted ? (
                <p className="text-sm text-fg-2">This is a sending-only key, so domains can’t be listed. Use “Send test” to confirm delivery.</p>
              ) : check.domains.length === 0 ? (
                <p className="text-sm text-fg-2">No domains in this Resend account yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {check.domains.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {d.name}
                        {d.name === fromDomain && <span className="ml-1 text-xs text-muted">(sender)</span>}
                      </span>
                      <Badge tone={d.status === "verified" ? "accent" : d.status === "failed" ? "danger" : "warn"}>{d.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        <Card title="Recent deliveries" description="Email status for the latest inquiries.">
          {log.length === 0 ? (
            <EmptyState title="No inquiries yet">Each contact-form submission and its email status will appear here.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Received</th>
                    <th className="py-2 pr-4 font-medium">From</th>
                    <th className="py-2 pr-4 font-medium">Notification to you</th>
                    <th className="py-2 font-medium">Visitor confirmation</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((i) => (
                    <tr key={i.id} className="border-t border-line align-top">
                      <td className="py-2 pr-4 whitespace-nowrap text-fg-2">{dateFmt.format(i.createdAt)}</td>
                      <td className="py-2 pr-4">
                        <Link href={`/admin/inquiries/${i.id}`} className="hover:text-accent">{i.name}</Link>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge tone={statusTone[i.adminEmailStatus]}>{emailStatusLabels[i.adminEmailStatus]}</Badge>
                        {i.adminEmailError && <p className="mt-1 max-w-sm text-xs break-words text-[#ffb4a8]">{i.adminEmailError}</p>}
                      </td>
                      <td className="py-2">
                        <Badge tone={statusTone[i.visitorEmailStatus]}>{emailStatusLabels[i.visitorEmailStatus]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Email templates">
          <div className="grid gap-4 lg:grid-cols-2">
            {templates.map((t) => (
              <TemplateForm key={t.key} t={{ key: t.key, subject: t.subject, body: t.body, enabled: t.enabled }} canEdit={canEdit} />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
