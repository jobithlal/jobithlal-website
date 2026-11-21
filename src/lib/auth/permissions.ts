import type { Role } from "@/generated/prisma/enums";

/**
 * Role → permission matrix. Every server action and admin page checks one of these
 * on the server; hiding a button in the UI is never the only protection.
 */
export const PERMISSIONS = [
  "dashboard:view",
  "content:view",
  "content:edit",
  "content:publish",
  "media:view",
  "media:upload",
  "media:delete",
  "portfolio:view",
  "portfolio:edit",
  "portfolio:publish",
  "inquiries:view",
  "inquiries:manage",
  "inquiries:export",
  "inquiries:delete",
  "settings:view",
  "settings:edit",
  "appearance:edit",
  "seo:edit",
  "analytics:view",
  "users:manage",
  "audit:view",
  "backup:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const EDITOR: Permission[] = [
  "dashboard:view",
  "content:view",
  "content:edit",
  "content:publish",
  "media:view",
  "media:upload",
  "media:delete",
  "portfolio:view",
  "portfolio:edit",
  "portfolio:publish",
  "inquiries:view",
  "inquiries:manage",
  "settings:view",
  "analytics:view",
];

const VIEWER: Permission[] = [
  "dashboard:view",
  "content:view",
  "media:view",
  "portfolio:view",
  "inquiries:view",
  "settings:view",
  "analytics:view",
];

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set(PERMISSIONS),
  EDITOR: new Set(EDITOR),
  VIEWER: new Set(VIEWER),
};

export function can(role: Role, permission: Permission) {
  return MATRIX[role].has(permission);
}

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};
