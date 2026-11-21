import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, FileEdit, Inbox, Mail, BarChart3, Database } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { requireDb } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Overview" };

const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Qatar" });

export default async function Overview() {
  const user = await requirePage("dashboard:view");
  const db = requireDb();
  const [published, drafts, demo, newInquiries, totalInquiries, recent] = await Promise.all([
    db.project.count({ where: { status: "PUBLISHED", isDemo: false } }),
    db.project.count({ where: { status: "DRAFT" } }),
    db.project.count({ where: { isDemo: true } }),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.inquiry.count(),
    // The security/activity log is restricted to roles with audit access.
    can(user.role, "audit:view")
      ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } })
      : Promise.resolve(null),
  ]);

  const stats = [
    { label: "Published projects", value: published, icon: FolderOpen, note: demo ? `${demo} sample layout${demo > 1 ? "s" : ""} not counted` : undefined },
    { label: "Draft projects", value: drafts, icon: FileEdit },
    { label: "New inquiries", value: newInquiries, icon: Inbox },
    { label: "Total inquiries", value: totalInquiries, icon: Mail },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-fg-2">Here&apos;s what&apos;s happening on jobithlal.com.</p>
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="rounded-xl border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-fg-2">{label}</p>
              <Icon className="size-4 text-accent" aria-hidden />
            </div>
            <p className="mt-3 font-display text-4xl font-bold">{value}</p>
            {note && <p className="mt-1 text-xs text-muted">{note}</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {recent && (
        <section aria-labelledby="activity" className="rounded-xl border border-line bg-card p-5 lg:col-span-2">
          <h2 id="activity" className="font-display text-lg font-bold">
            Recent activity
          </h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No activity recorded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    <span className="font-medium">{a.user?.name ?? "System"}</span> <span className="text-fg-2">{a.action.replaceAll(".", " · ")}</span>
                  </span>
                  <time className="text-xs text-muted" dateTime={a.createdAt.toISOString()}>
                    {fmt.format(a.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        <section aria-labelledby="status" className="space-y-3 rounded-xl border border-line bg-card p-5">
          <h2 id="status" className="font-display text-lg font-bold">
            Setup status
          </h2>
          <StatusRow icon={Database} label="Database" ok detail="Connected" />
          <StatusRow icon={Mail} label="Email notifications" ok={emailConfigured()} detail={emailConfigured() ? "Resend configured" : "Add RESEND_API_KEY and CONTACT_FROM_EMAIL"} />
          <StatusRow icon={BarChart3} label="Analytics" ok={false} detail="Not connected — GA4 setup arrives in Phase 7. No figures are shown until then." />
          <Link href="/" target="_blank" className="inline-block pt-2 text-sm text-accent underline-offset-4 hover:underline">
            Preview website ↗
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatusRow({ icon: Icon, label, ok, detail }: { icon: typeof Mail; label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-bg-2 p-3">
      <Icon className={ok ? "mt-0.5 size-4 text-accent" : "mt-0.5 size-4 text-muted"} aria-hidden />
      <div>
        <p className="text-sm font-medium">
          {label} <span className={ok ? "text-accent" : "text-muted"}>· {ok ? "Ready" : "Setup needed"}</span>
        </p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
    </div>
  );
}
