"use server";

import { z } from "zod";
import { refresh, updateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requireDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { TAGS } from "@/lib/content";
import { formObject, guarded, type ActionResult } from "@/lib/admin/action";
import { buildSection, fieldErrorsFrom, SECTION_LABELS } from "@/lib/admin/sections";

const json = (v: unknown) => v as Prisma.InputJsonValue;
const keySchema = z.enum(Object.keys(SECTION_LABELS) as [string, ...string[]]);

async function homePage() {
  return requireDb().page.findUniqueOrThrow({ where: { slug: "home" }, include: { sections: { orderBy: { order: "asc" } } } });
}

/** Save a section as a draft (default) or save and publish just this section. */
export async function saveSection(key: string, fd: FormData): Promise<ActionResult> {
  const intent = fd.get("intent") === "publish" ? "publish" : "draft";
  return guarded(intent === "publish" ? "content:publish" : "content:edit", async (user) => {
    const k = keySchema.parse(key);
    const flat = formObject(fd);
    delete flat.intent;
    let data: unknown;
    try {
      data = buildSection(k, flat);
    } catch (e) {
      if (e instanceof z.ZodError) return { ok: false, error: "Some fields need attention.", fieldErrors: fieldErrorsFrom(e) };
      throw e;
    }
    const page = await homePage();
    const section = page.sections.find((s) => s.key === k);
    if (!section) return { ok: false, error: "Section not found. Run the database seed." };

    if (intent === "publish") {
      await requireDb().$transaction(async (tx) => {
        await tx.pageSection.update({ where: { id: section.id }, data: { publishedData: json(data), draftData: Prisma.DbNull } });
        await snapshot(tx, page.id, user.id, `Published ${SECTION_LABELS[k]}`);
      });
      updateTag(TAGS.home);
    } else {
      await requireDb().pageSection.update({ where: { id: section.id }, data: { draftData: json(data) } });
    }
    await audit(`content.section.${intent === "publish" ? "published" : "draft_saved"}`, { userId: user.id, entity: "PageSection", entityId: section.id, details: { key: k } });
    refresh();
    return { ok: true, message: intent === "publish" ? `${SECTION_LABELS[k]} is live.` : `Draft saved — not live until you publish.` };
  });
}

async function snapshot(tx: Prisma.TransactionClient, pageId: string, userId: string, note: string) {
  const sections = await tx.pageSection.findMany({ where: { pageId }, orderBy: { order: "asc" } });
  await tx.pageRevision.create({
    data: {
      pageId,
      createdById: userId,
      note,
      snapshot: json(sections.map((s) => ({ key: s.key, order: s.order, visible: s.visible, data: s.publishedData }))),
    },
  });
}

/** Publish every pending draft on the page at once. */
export async function publishAllDrafts(): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const page = await homePage();
    const drafts = page.sections.filter((s) => s.draftData !== null);
    if (!drafts.length) return { ok: true, message: "Nothing to publish — no pending drafts." };
    await requireDb().$transaction(async (tx) => {
      for (const s of drafts) {
        await tx.pageSection.update({ where: { id: s.id }, data: { publishedData: json(s.draftData), draftData: Prisma.DbNull } });
      }
      await snapshot(tx, page.id, user.id, `Published ${drafts.map((d) => SECTION_LABELS[d.key] ?? d.key).join(", ")}`);
    });
    await audit("content.published", { userId: user.id, entity: "Page", entityId: page.id, details: { sections: drafts.map((d) => d.key) } });
    updateTag(TAGS.home);
    refresh();
    return { ok: true, message: `Published ${drafts.length} section${drafts.length > 1 ? "s" : ""}. The homepage is updated.` };
  });
}

export async function discardDraft(key: string): Promise<ActionResult> {
  return guarded("content:edit", async (user) => {
    const k = keySchema.parse(key);
    const page = await homePage();
    const s = page.sections.find((x) => x.key === k)!;
    await requireDb().pageSection.update({ where: { id: s.id }, data: { draftData: Prisma.DbNull } });
    await audit("content.section.draft_discarded", { userId: user.id, entity: "PageSection", entityId: s.id, details: { key: k } });
    refresh();
    return { ok: true, message: "Draft discarded." };
  });
}

/** Show/hide and reorder sections — applies to the live page immediately. */
export async function setSectionVisible(key: string, visible: boolean): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const k = keySchema.parse(key);
    const page = await homePage();
    const s = page.sections.find((x) => x.key === k)!;
    await requireDb().pageSection.update({ where: { id: s.id }, data: { visible } });
    await audit("content.section.visibility", { userId: user.id, entity: "PageSection", entityId: s.id, details: { key: k, visible } });
    updateTag(TAGS.home);
    refresh();
    return { ok: true, message: `${SECTION_LABELS[k]} ${visible ? "shown" : "hidden"} on the homepage.` };
  });
}

export async function moveSection(key: string, dir: "up" | "down"): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const page = await homePage();
    const list = [...page.sections];
    const i = list.findIndex((s) => s.key === key);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return { ok: true };
    [list[i], list[j]] = [list[j], list[i]];
    const db = requireDb();
    await db.$transaction(list.map((s, order) => db.pageSection.update({ where: { id: s.id }, data: { order } })));
    await audit("content.section.reordered", { userId: user.id, entity: "Page", entityId: page.id, details: { key, dir } });
    updateTag(TAGS.home);
    refresh();
    return { ok: true };
  });
}

/** Load a previous version into drafts, so it can be reviewed and then published. */
export async function restoreRevision(revisionId: string): Promise<ActionResult> {
  return guarded("content:publish", async (user) => {
    const db = requireDb();
    const rev = await db.pageRevision.findUniqueOrThrow({ where: { id: z.string().max(40).parse(revisionId) } });
    const snap = rev.snapshot as { key: string; data: unknown }[];
    const page = await homePage();
    await db.$transaction(
      page.sections.filter((s) => snap.some((x) => x.key === s.key)).map((s) => db.pageSection.update({ where: { id: s.id }, data: { draftData: json(snap.find((x) => x.key === s.key)!.data) } })),
    );
    await audit("content.revision.restored", { userId: user.id, entity: "PageRevision", entityId: rev.id });
    refresh();
    return { ok: true, message: "That version is loaded as drafts. Review it, then publish." };
  });
}
