import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { Card, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";
import { PasswordForm, SessionRevoke, TwoFactor } from "./AccountClient";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requirePage("dashboard:view");
  const sessions = await requireDb().session.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } });
  return (
    <>
      <PageHeader title="My account" description={`${user.name} · ${user.email} · ${roleLabels[user.role]}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change password">
          <PasswordForm />
        </Card>
        <Card title="Two-step sign-in" description="Adds a 6-digit code from an authenticator app (Google Authenticator, 1Password, Authy…) at every sign-in.">
          <TwoFactor enabled={user.totpEnabled} />
        </Card>
        <Card title="Where you're signed in" className="lg:col-span-2">
          <ul className="divide-y divide-line text-sm">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className="font-medium">{describeAgent(s.userAgent)}</span>
                  {s.id === user.sessionId && <span className="ml-2 text-xs text-accent">This device</span>}
                  <span className="block text-xs text-muted">
                    Signed in {dateFmt.format(s.createdAt)} · last active {dateFmt.format(s.lastSeenAt)}
                  </span>
                </span>
                {s.id !== user.sessionId && <SessionRevoke id={s.id} />}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function describeAgent(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` on ${os}` : ""}`;
}
