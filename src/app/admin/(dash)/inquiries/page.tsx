import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { getServiceLabels } from "@/lib/content";
import { Badge, EmptyState, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";
import { statusLabels, statusTone } from "./labels";

export const metadata: Metadata = { title: "Inquiries" };
const PAGE_SIZE = 25;

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  const user = await requirePage("inquiries:view");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = typeof sp.status === "string" && sp.status in statusLabels ? sp.status : "";
  const service = typeof sp.service === "string" ? sp.service : "";
  const sort = sp.sort === "oldest" ? "oldest" : "newest";
  const unread = sp.unread === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.InquiryWhereInput = {
    ...(status ? { status: status as keyof typeof statusLabels } : {}),
    ...(service ? { service } : {}),
    ...(unread ? { readAt: null } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { details: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const db = requireDb();
  const [rows, total] = await Promise.all([
    db.inquiry.findMany({
      where,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: { id: true, name: true, email: true, service: true, status: true, createdAt: true, readAt: true, sourcePage: true, adminEmailStatus: true },
    }),
    db.inquiry.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const labels = await getServiceLabels();
  const svc = (v: string) => labels[v] ?? v;
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(service && { service }), ...(unread && { unread: "1" }), sort });
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return `?${p}`;
  };

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Every project inquiry from the contact form. New ones are saved even if email delivery fails."
        actions={
          can(user.role, "inquiries:export") && (
            <a
              href={`/admin/inquiries/export${qs({})}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-bg-2 px-4 text-sm font-semibold hover:border-fg-2/50"
            >
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          )
        }
      />

      <form className="mb-4 grid gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-6" role="search" aria-label="Filter inquiries">
        <label className="lg:col-span-2">
          <span className="sr-only">Search</span>
          <input name="q" defaultValue={q} placeholder="Search name, email, company, details…" className="h-10 w-full rounded-lg border border-line bg-bg-2 px-3 text-sm outline-none focus:border-accent" />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status} className="h-10 w-full rounded-lg border border-line bg-bg-2 px-3 text-sm">
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Service</span>
          <select name="service" defaultValue={service} className="h-10 w-full rounded-lg border border-line bg-bg-2 px-3 text-sm">
            <option value="">All services</option>
            {Object.entries(labels).map(([value, label]) => ({ value, label })).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select name="sort" defaultValue={sort} className="h-10 w-full rounded-lg border border-line bg-bg-2 px-3 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-fg-2">
            <input type="checkbox" name="unread" value="1" defaultChecked={unread} className="size-4 accent-[var(--accent)]" /> Unread
          </label>
          <button className="ml-auto h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-ink">Apply</button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={total === 0 && !q && !status && !service && !unread ? "No inquiries yet" : "No inquiries match these filters"}>
          {total === 0 && !q ? "When someone submits the contact form, it appears here." : <Link href="/admin/inquiries" className="text-accent">Clear filters</Link>}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-bg-2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={r.readAt ? "" : "bg-accent/[0.03]"}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      {!r.readAt && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                      <span className={r.readAt ? "" : "font-semibold"}>{r.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-2">{r.email}</td>
                  <td className="px-4 py-3 text-fg-2">{svc(r.service)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-2">{dateFmt.format(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[r.status]}>{statusLabels[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{r.sourcePage ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/inquiries/${r.id}`} className="font-semibold text-accent hover:underline">
                      View<span className="sr-only"> inquiry from {r.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-fg-2">
          <span>
            Page {page} of {pages} · {total} inquiries
          </span>
          <span className="flex gap-2">
            {page > 1 && <Link className="rounded-lg border border-line px-3 py-1.5 hover:border-accent" href={qs({ page: page - 1 })}>Previous</Link>}
            {page < pages && <Link className="rounded-lg border border-line px-3 py-1.5 hover:border-accent" href={qs({ page: page + 1 })}>Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
