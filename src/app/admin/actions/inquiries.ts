"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { guarded, type ActionResult } from "@/lib/admin/action";

const STATUSES = ["NEW", "CONTACTED", "IN_DISCUSSION", "PROPOSAL_SENT", "WON", "CLOSED"] as const;
const id = z.string().min(1).max(40);

export async function setInquiryStatus(inquiryId: string, status: string): Promise<ActionResult> {
  return guarded("inquiries:manage", async (user) => {
    const s = z.enum(STATUSES).parse(status);
    const row = await requireDb().inquiry.update({ where: { id: id.parse(inquiryId) }, data: { status: s, readAt: new Date() } });
    await audit("inquiry.status", { userId: user.id, entity: "Inquiry", entityId: row.id, details: { status: s } });
    refresh();
    return { ok: true, message: "Status updated." };
  });
}

export async function setInquiryRead(inquiryId: string, read: boolean): Promise<ActionResult> {
  return guarded("inquiries:manage", async () => {
    await requireDb().inquiry.update({ where: { id: id.parse(inquiryId) }, data: { readAt: read ? new Date() : null } });
    refresh();
    return { ok: true, message: read ? "Marked as read." : "Marked as unread." };
  });
}

export async function addInquiryNote(inquiryId: string, fd: FormData): Promise<ActionResult> {
  return guarded("inquiries:manage", async (user) => {
    const body = z.string().trim().min(1, "Write a note first.").max(4000).parse(fd.get("body"));
    const note = await requireDb().inquiryNote.create({ data: { inquiryId: id.parse(inquiryId), authorId: user.id, body } });
    await audit("inquiry.note", { userId: user.id, entity: "Inquiry", entityId: inquiryId, details: { noteId: note.id } });
    refresh();
    return { ok: true, message: "Note added." };
  });
}

export async function deleteInquiryNote(noteId: string): Promise<ActionResult> {
  return guarded("inquiries:manage", async (user) => {
    const n = await requireDb().inquiryNote.delete({ where: { id: id.parse(noteId) } });
    await audit("inquiry.note_deleted", { userId: user.id, entity: "Inquiry", entityId: n.inquiryId });
    refresh();
    return { ok: true, message: "Note deleted." };
  });
}

export async function deleteInquiry(inquiryId: string): Promise<ActionResult> {
  return guarded("inquiries:delete", async (user) => {
    const row = await requireDb().inquiry.delete({ where: { id: id.parse(inquiryId) } });
    // Keep a minimal, non-personal trace of the deletion.
    await audit("inquiry.deleted", { userId: user.id, entity: "Inquiry", entityId: row.id, details: { service: row.service, createdAt: row.createdAt.toISOString() } });
    return { ok: true, message: "Inquiry deleted." };
  });
}
