import "server-only";
import { createSign } from "node:crypto";

/**
 * Read-only access to the GA4 Data API with a Google Cloud service account.
 * Required env (server only): GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY.
 * The service account must be added as a "Viewer" on the GA4 property.
 */

export function ga4ReportingConfigured() {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY);
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

let token: { value: string; exp: number } | null = null;

async function accessToken() {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: process.env.GA4_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  // Vercel stores multi-line keys with literal "\n" — restore real newlines.
  const key = process.env.GA4_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const sig = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${sig}` }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const body = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`Google sign-in failed: ${body.error_description ?? res.status}`);
  token = { value: body.access_token, exp: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return token.value;
}

type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
type ReportReq = {
  dateRanges: { startDate: string; endDate: string; name?: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: unknown;
  orderBys?: unknown[];
  limit?: number;
};

async function runReports(requests: ReportReq[]) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:batchRunReports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const body = (await res.json()) as { reports?: { rows?: Row[] }[]; error?: { message: string } };
  if (!res.ok) throw new Error(body.error?.message ?? `GA4 API error ${res.status}`);
  return body.reports ?? [];
}

export type Ga4Summary = {
  days: number;
  totals: { users: number; sessions: number; views: number; usersPrev: number; sessionsPrev: number; viewsPrev: number };
  daily: { date: string; users: number; views: number }[];
  topPages: { path: string; views: number }[];
  channels: { channel: string; sessions: number }[];
  events: { name: string; count: number }[];
  servicePageViews: number;
};

const n = (v?: string) => Number(v ?? 0) || 0;
let cache: { at: number; days: number; data: Ga4Summary } | null = null;

/** 28-day (or `days`) overview, cached for 10 minutes to stay well within API quotas. */
export async function getGa4Summary(days = 28): Promise<Ga4Summary> {
  if (cache && cache.days === days && Date.now() - cache.at < 10 * 60_000) return cache.data;
  const cur = { startDate: `${days}daysAgo`, endDate: "today" };
  const prev = { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` };
  const [totals, daily, pages, channels, events] = await runReports([
    { dateRanges: [cur, prev], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }] },
    { dateRanges: [cur], dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }] },
    { dateRanges: [cur], dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 50 },
    { dateRanges: [cur], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 },
    {
      dateRanges: [cur],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["contact_submit", "portfolio_open", "cta_click", "service_open"] } } },
    },
  ]);

  // With two date ranges GA4 adds a "date_range_N" dimension; rows are per range.
  const tRows = totals.rows ?? [];
  const byRange = (i: number) => tRows.find((r) => r.dimensionValues?.[0]?.value === `date_range_${i}`) ?? tRows[i];
  const t0 = byRange(0)?.metricValues ?? [];
  const t1 = byRange(1)?.metricValues ?? [];
  const allPages = (pages.rows ?? []).map((r) => ({ path: r.dimensionValues?.[0]?.value ?? "", views: n(r.metricValues?.[0]?.value) }));

  const data: Ga4Summary = {
    days,
    totals: { users: n(t0[0]?.value), sessions: n(t0[1]?.value), views: n(t0[2]?.value), usersPrev: n(t1[0]?.value), sessionsPrev: n(t1[1]?.value), viewsPrev: n(t1[2]?.value) },
    daily: (daily.rows ?? []).map((r) => {
      const d = r.dimensionValues?.[0]?.value ?? "";
      return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, users: n(r.metricValues?.[0]?.value), views: n(r.metricValues?.[1]?.value) };
    }),
    topPages: allPages.slice(0, 10),
    channels: (channels.rows ?? []).map((r) => ({ channel: r.dimensionValues?.[0]?.value ?? "", sessions: n(r.metricValues?.[0]?.value) })),
    events: (events.rows ?? []).map((r) => ({ name: r.dimensionValues?.[0]?.value ?? "", count: n(r.metricValues?.[0]?.value) })),
    servicePageViews: allPages.filter((p) => p.path.startsWith("/services/")).reduce((a, p) => a + p.views, 0),
  };
  cache = { at: Date.now(), days, data };
  return data;
}
