import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { serviceOptions } from "@/lib/contact-schema";

/** Escape for CSV, and neutralise spreadsheet formula injection (=, +, -, @). */
function cell(v: unknown) {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!can(user.role, "inquiries:export")) return new Response("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.slice(0, 100) ?? "";
  const where: Prisma.InquiryWhereInput = {
    ...(sp.get("status") ? { status: sp.get("status") as Prisma.InquiryWhereInput["status"] } : {}),
    ...(sp.get("service") ? { service: sp.get("service")! } : {}),
    ...(sp.get("unread") === "1" ? { readAt: null } : {}),
    ...(q ? { OR: ["name", "email", "company", "details"].map((f) => ({ [f]: { contains: q, mode: "insensitive" } })) } : {}),
  };
  const rows = await requireDb().inquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 10_000 });
  const svc = (v: string) => serviceOptions.find((o) => o.value === v)?.label ?? v;
  const header = ["Date", "Name", "Email", "Company", "Phone", "Service", "Budget", "Timeline", "Status", "Source page", "Email delivery", "Details"];
  const lines = rows.map((r) =>
    [r.createdAt, r.name, r.email, r.company, r.phone, svc(r.service), r.budget, r.timeline, r.status, r.sourcePage, r.adminEmailStatus, r.details].map(cell).join(","),
  );
  await audit("inquiry.export", { userId: user.id, details: { count: rows.length } });
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jobithlal-inquiries-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
