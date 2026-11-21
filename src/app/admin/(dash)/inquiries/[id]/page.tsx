import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { serviceOptions } from "@/lib/contact-schema";
import { whatsappLink } from "@/lib/utils";
import { Badge, Card, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";
import { emailStatusLabels } from "../labels";
import { InquiryControls, NoteForm, NoteDelete } from "./InquiryClient";

export const metadata: Metadata = { title: "Inquiry" };

export default async function InquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  const user = await requirePage("inquiries:view");
  const { id } = await params;
  const db = requireDb();
  const inq = await db.inquiry.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } } },
  });
  if (!inq) notFound();

  // Opening an inquiry marks it as read (only for roles that manage inquiries).
  if (!inq.readAt && can(user.role, "inquiries:manage")) {
    await db.inquiry.update({ where: { id }, data: { readAt: new Date() } });
  }
  const manage = can(user.role, "inquiries:manage");
  const svc = serviceOptions.find((o) => o.value === inq.service)?.label ?? inq.service;
  const facts: [string, string | null][] = [
    ["Service", svc],
    ["Company", inq.company],
    ["Budget", inq.budget],
    ["Timeline", inq.timeline],
    ["Received", dateFmt.format(inq.createdAt)],
    ["Source page", inq.sourcePage],
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/inquiries", label: "All inquiries" }}
        title={inq.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {inq.email}
            <Badge tone={inq.adminEmailStatus === "FAILED" ? "danger" : "muted"}>{emailStatusLabels[inq.adminEmailStatus]}</Badge>
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Project details">
            <p className="whitespace-pre-wrap leading-relaxed text-fg-2">{inq.details}</p>
          </Card>
          <Card title="Private notes" description="Only visible to admins.">
            {manage && <NoteForm inquiryId={inq.id} />}
            {inq.notes.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No notes yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {inq.notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-bg-2 p-3 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-2 flex items-center justify-between text-xs text-muted">
                      <span>
                        {n.author?.name ?? "Former user"} · {dateFmt.format(n.createdAt)}
                      </span>
                      {manage && <NoteDelete noteId={n.id} />}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Status">
            <InquiryControls
              inquiryId={inq.id}
              status={inq.status}
              read={Boolean(inq.readAt)}
              canManage={manage}
              canDelete={can(user.role, "inquiries:delete")}
            />
          </Card>
          <Card title="Details">
            <dl className="space-y-2 text-sm">
              {facts
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`mailto:${inq.email}?subject=${encodeURIComponent(`Re: your ${svc} inquiry`)}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-ink">
                <Mail className="size-4" aria-hidden /> Reply by email
              </a>
              {inq.phone && (
                <>
                  <a href={whatsappLink(inq.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm">
                    <MessageCircle className="size-4" aria-hidden /> WhatsApp
                  </a>
                  <a href={`tel:${inq.phone}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm">
                    <Phone className="size-4" aria-hidden /> {inq.phone}
                  </a>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
