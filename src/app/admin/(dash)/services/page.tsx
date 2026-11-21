import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { requireDb } from "@/lib/db";
import { Badge, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdmin() {
  await requirePage("content:view");
  const services = await requireDb().service.findMany({ orderBy: { order: "asc" } });
  return (
    <>
      <PageHeader title="Services" description="The three service cards and their landing pages. Changes go live when you save." />
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {services.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 bg-card p-4">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/services/${s.slug}`} className="font-semibold hover:text-accent">
                {s.title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {s.enabled ? <Badge tone="accent">Enabled</Badge> : <Badge tone="muted">Disabled</Badge>}
                <span>/services/{s.slug}</span>
                <span>· updated {dateFmt.format(s.updatedAt)}</span>
              </p>
            </div>
            <a href={`/services/${s.slug}`} target="_blank" rel="noopener" className="text-sm text-fg-2 hover:text-accent">
              View ↗
            </a>
            <Link href={`/admin/services/${s.slug}`} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-semibold hover:border-accent">
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
