import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getAnalyticsSettings } from "@/lib/content";
import { ga4ReportingConfigured, getGa4Summary, type Ga4Summary } from "@/lib/ga4";
import { Badge, Card, EmptyState, PageHeader } from "@/components/admin/kit";
import { AnalyticsForm } from "./AnalyticsForm";

export const metadata: Metadata = { title: "Analytics" };

const num = new Intl.NumberFormat("en-GB");
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Qatar" });

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

const EVENT_LABELS: Record<string, string> = {
  contact_submit: "Contact form submitted",
  portfolio_open: "Project opened",
  service_open: "Service opened",
  cta_click: "Button (CTA) clicked",
};

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev) return <span className="text-xs text-muted">no earlier data</span>;
  const pct = Math.round(((now - prev) / prev) * 100);
  return <span className={pct >= 0 ? "text-xs text-accent" : "text-xs text-[#ffb4a8]"}>{pct >= 0 ? "+" : ""}{pct}% vs previous period</span>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <p className="text-sm text-fg-2">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

/** Simple horizontal bar list — values are always real counts, never padded. */
function Bars({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="truncate text-fg-2">{r.label}</span>
            <span className="tabular-nums">{num.format(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-bg-2">
            <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DailyChart({ daily }: { daily: Ga4Summary["daily"] }) {
  if (!daily.length) return <p className="text-sm text-muted">No visits recorded in this period yet.</p>;
  const max = Math.max(...daily.map((d) => d.views), 1);
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label="Daily page views">
        {daily.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div className="rounded-t-sm bg-accent/80 group-hover:bg-accent" style={{ height: `${Math.max(2, (d.views / max) * 144)}px` }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-bg-2 px-2 py-1 text-xs group-hover:block">
              {dayFmt.format(new Date(d.date))}: {num.format(d.views)} views · {num.format(d.users)} users
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{dayFmt.format(new Date(daily[0].date))}</span>
        <span>{dayFmt.format(new Date(daily[daily.length - 1].date))}</span>
      </div>
    </div>
  );
}

async function Ga4Report() {
  let data: Ga4Summary;
  try {
    data = await getGa4Summary(28);
  } catch (err) {
    return (
      <Card title="Google Analytics report">
        <p className="text-sm text-[#ffb4a8]">Couldn’t load figures from Google Analytics: {(err as Error).message}</p>
        <p className="mt-2 text-sm text-fg-2">Check that the service account has Viewer access on the GA4 property and that GA4_PROPERTY_ID is the numeric property ID.</p>
      </Card>
    );
  }
  const t = data.totals;
  return (
    <section className="space-y-6" aria-labelledby="ga4">
      <div className="flex items-center gap-3">
        <h2 id="ga4" className="font-display text-lg font-bold">Website traffic</h2>
        <Badge tone="muted">Google Analytics · last {data.days} days</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Visitors" value={num.format(t.users)} sub={<Delta now={t.users} prev={t.usersPrev} />} />
        <Stat label="Sessions" value={num.format(t.sessions)} sub={<Delta now={t.sessions} prev={t.sessionsPrev} />} />
        <Stat label="Page views" value={num.format(t.views)} sub={<Delta now={t.views} prev={t.viewsPrev} />} />
      </div>
      <Card title="Daily page views">
        <DailyChart daily={data.daily} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top pages">
          <Bars rows={data.topPages.map((p) => ({ label: p.path, value: p.views }))} empty="No page views yet." />
        </Card>
        <Card title="Traffic sources">
          <Bars rows={data.channels.map((c) => ({ label: c.channel, value: c.sessions }))} empty="No sessions yet." />
        </Card>
        <Card title="Key actions" description="Events sent by the website when visitors interact.">
          <Bars rows={data.events.map((ev) => ({ label: EVENT_LABELS[ev.name] ?? ev.name, value: ev.count }))} empty="No tracked actions yet." />
        </Card>
        <Card title="Service page views">
          <p className="font-display text-3xl font-bold tabular-nums">{num.format(data.servicePageViews)}</p>
          <p className="mt-1 text-sm text-fg-2">Views across all /services/ pages in this period.</p>
        </Card>
      </div>
    </section>
  );
}

export default async function AnalyticsPage() {
  const user = await requirePage("analytics:view");
  const settings = await getAnalyticsSettings();
  const db = requireDb();
  const since90 = daysAgo(90);
  const since30 = daysAgo(30);
  const [last30, last90, byService, bySource, total] = await Promise.all([
    db.inquiry.count({ where: { createdAt: { gte: since30 } } }),
    db.inquiry.count({ where: { createdAt: { gte: since90 } } }),
    db.inquiry.groupBy({ by: ["service"], where: { createdAt: { gte: since90 } }, _count: { _all: true }, orderBy: { _count: { service: "desc" } } }),
    db.inquiry.groupBy({ by: ["sourcePage"], where: { createdAt: { gte: since90 } }, _count: { _all: true }, orderBy: { _count: { sourcePage: "desc" } }, take: 8 }),
    db.inquiry.count(),
  ]);
  const won = await db.inquiry.count({ where: { createdAt: { gte: since90 }, status: "WON" } });
  const reporting = ga4ReportingConfigured();
  const live = settings.enabled && Boolean(settings.ga4MeasurementId);

  return (
    <>
      <PageHeader title="Analytics" description="Real numbers only — website traffic from Google Analytics and enquiries from your own database." />
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={live ? "accent" : "muted"}>{live ? "Tracking on" : "Tracking off"}</Badge>
          {live && <Badge tone="neutral">{settings.requireConsent ? "Consent banner shown" : "No consent banner"}</Badge>}
          <Badge tone={reporting ? "accent" : "muted"}>{reporting ? "Dashboard report connected" : "Dashboard report not connected"}</Badge>
        </div>

        <section className="space-y-4" aria-labelledby="enq">
          <div className="flex items-center gap-3">
            <h2 id="enq" className="font-display text-lg font-bold">Enquiries</h2>
            <Badge tone="muted">From the contact form</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Last 30 days" value={num.format(last30)} />
            <Stat label="Last 90 days" value={num.format(last90)} />
            <Stat label="Won (90 days)" value={num.format(won)} />
            <Stat label="All time" value={num.format(total)} />
          </div>
          {total === 0 ? (
            <EmptyState title="No enquiries yet">Figures appear here as soon as someone submits the contact form.</EmptyState>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="By service (90 days)">
                <Bars rows={byService.map((r) => ({ label: r.service, value: r._count._all }))} empty="No enquiries in the last 90 days." />
              </Card>
              <Card title="Submitted from (90 days)">
                <Bars rows={bySource.map((r) => ({ label: r.sourcePage || "Unknown page", value: r._count._all }))} empty="No enquiries in the last 90 days." />
              </Card>
            </div>
          )}
          <Link href="/admin/inquiries" className="inline-block text-sm text-accent underline-offset-4 hover:underline">
            Open inquiries →
          </Link>
        </section>

        {reporting ? (
          <Ga4Report />
        ) : (
          <Card title="Website traffic" description="Visitor, page-view and traffic-source figures appear here once the read-only report connection is set up.">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-fg-2">
              <li>Turn on tracking below with your GA4 Measurement ID.</li>
              <li>In Google Cloud, enable the “Google Analytics Data API” and create a service account with a JSON key.</li>
              <li>In GA4 → Admin → Property access management, add the service account email as a Viewer.</li>
              <li>
                In Vercel → Settings → Environment Variables add <code className="text-fg">GA4_PROPERTY_ID</code> (numeric property ID), <code className="text-fg">GA4_CLIENT_EMAIL</code> and <code className="text-fg">GA4_PRIVATE_KEY</code>, then redeploy.
              </li>
            </ol>
            <p className="mt-3 text-xs text-muted">No traffic figures are shown until this is connected — nothing is estimated.</p>
          </Card>
        )}

        <AnalyticsForm v={settings} canEdit={can(user.role, "settings:edit")} />
      </div>
    </>
  );
}
