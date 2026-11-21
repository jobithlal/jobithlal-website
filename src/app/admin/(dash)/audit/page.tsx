import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { requirePage } from "@/lib/auth/session";
import { requireDb } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";

export const metadata: Metadata = { title: "Activity log" };
const PAGE = 50;

const GROUPS: Record<string, string> = {
  "": "All activity",
  "auth.": "Sign-ins & security",
  "content.": "Website content",
  "project.": "Portfolio",
  "service.": "Services",
  "media.": "Media",
  "inquiry.": "Inquiries",
  "settings.": "Settings",
  "user.": "Users",
};

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requirePage("audit:view");
  const sp = await searchParams;
  const group = typeof sp.group === "string" && sp.group in GROUPS ? sp.group : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.AuditLogWhereInput = group ? { action: { startsWith: group } } : {};
  const db = requireDb();
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE, include: { user: { select: { name: true } } } }),
    db.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <>
      <PageHeader title="Activity log" description="Sign-ins, failed attempts and every significant change in the admin. IP addresses are stored only as one-way fingerprints." />
      <nav aria-label="Filter activity" className="mb-4 flex flex-wrap gap-2 text-sm">
        {Object.entries(GROUPS).map(([k, label]) => (
          <Link key={k} href={k ? `/admin/audit?group=${k}` : "/admin/audit"} className={`rounded-full border px-3 py-1 ${group === k ? "border-accent text-accent" : "border-line text-fg-2"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState title="No activity recorded" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-bg-2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={r.action.includes("failed") || r.action.includes("locked") || r.action.includes("rejected") ? "bg-[#ff8a7a]/5" : ""}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-fg-2">{dateFmt.format(r.createdAt)}</td>
                  <td className="px-4 py-2.5">{r.user?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.action}</td>
                  <td className="max-w-md truncate px-4 py-2.5 font-mono text-xs text-muted">{r.details ? JSON.stringify(r.details) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-fg-2">
          <span>
            Page {page} of {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 && <Link className="rounded-lg border border-line px-3 py-1.5" href={`?group=${group}&page=${page - 1}`}>Previous</Link>}
            {page < pages && <Link className="rounded-lg border border-line px-3 py-1.5" href={`?group=${group}&page=${page + 1}`}>Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
