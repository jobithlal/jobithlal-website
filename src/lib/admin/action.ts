import "server-only";
import { z } from "zod";
import { AuthError, requireAction, type CurrentUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";

export type ActionResult<T = unknown> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Wraps an admin server action: checks the permission on the server, turns
 * validation and auth failures into user-readable results, and never leaks
 * internal error details to the browser.
 */
export async function guarded<T>(
  permission: Permission,
  fn: (user: CurrentUser) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    const user = await requireAction(permission);
    return await fn(user);
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) {
      return { ok: false, error: "Please check the highlighted fields.", fieldErrors: e.flatten().fieldErrors as Record<string, string[]> };
    }
    if ((e as { code?: string }).code === "P2002") return { ok: false, error: "That value is already in use (it must be unique)." };
    if ((e as { code?: string }).code === "P2003") return { ok: false, error: "This item is still in use elsewhere, so it can't be removed." };
    if ((e as { code?: string }).code === "P2025") return { ok: false, error: "That item no longer exists. Refresh the page." };
    // Re-throw Next.js control-flow errors (redirect/notFound).
    if ((e as { digest?: string }).digest?.startsWith("NEXT_")) throw e;
    console.error("[admin action]", e);
    return { ok: false, error: "Something went wrong saving that. Please try again." };
  }
}

/** FormData → plain object; repeated keys become arrays. */
export function formObject(fd: FormData) {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;
    if (k in out) out[k] = ([] as string[]).concat(out[k], v);
    else out[k] = v;
  }
  return out;
}

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
