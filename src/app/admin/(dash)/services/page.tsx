import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { DeleteServiceButton, NewServiceForm } from "./ServicesClient";
import { requireDb } from "@/lib/db";
import { Badge, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdmin() {
  const user = await requirePage("content:view");
  const canEdit = can(user.role, "content:publish");
  const services = await requireDb().service.findMany({ orderBy: { order: "asc" } });
  return (
    <>
      <PageHeader title="Services" description="Each service has a homepage card, its own landing page, a contact-form option and a portfolio category." />
      {canEdit && (
        <div className="mb-6">
          <NewServiceForm />
        </div>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {services.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 bg-card p-4">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/services/${s.slug}`} className="font-semibold hover:text-accent">
                {s.title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {s.enabled ? <Badge tone="accent">On the website</Badge> : <Badge tone="muted">Off (draft)</Badge>}
                <span>/services/{s.slug}</span>
                <span>· updated {dateFmt.format(s.updatedAt)}</span>
              </p>
            </div>
            {s.enabled && (
              <a href={`/services/${s.slug}`} target="_blank" rel="noopener" className="text-sm text-fg-2 hover:text-accent">
                View ↗
              </a>
            )}
            <Link href={`/admin/services/${s.slug}`} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-semibold hover:border-accent">
              Edit
            </Link>
            {canEdit && <DeleteServiceButton slug={s.slug} title={s.title} />}
          </li>
        ))}
      </ul>
    </>
  );
}
