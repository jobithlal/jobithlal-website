import { Suspense } from "react";
import { requirePage } from "@/lib/auth/session";
import { can, roleLabels, type Permission } from "@/lib/auth/permissions";
import { AdminShell, type NavKey } from "@/components/admin/AdminShell";
import { requireDb } from "@/lib/db";

const NAV_PERMS: [NavKey, Permission][] = [
  ["overview", "dashboard:view"],
  ["content", "content:view"],
  ["services", "content:view"],
  ["portfolio", "portfolio:view"],
  ["blog", "content:view"],
  ["media", "media:view"],
  ["inquiries", "inquiries:view"],
  ["seo", "settings:view"],
  ["analytics", "analytics:view"],
  ["email", "settings:view"],
  ["settings", "settings:view"],
  ["users", "users:manage"],
  ["audit", "audit:view"],
];

async function Gate({ children }: { children: React.ReactNode }) {
  const user = await requirePage("dashboard:view");
  const nav = NAV_PERMS.filter(([, p]) => can(user.role, p)).map(([k]) => k);
  const unread = can(user.role, "inquiries:view") ? await requireDb().inquiry.count({ where: { readAt: null } }) : 0;
  return (
    <AdminShell user={{ name: user.name, email: user.email, roleLabel: roleLabels[user.role] }} nav={nav} unread={unread}>
      {children}
    </AdminShell>
  );
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-muted">Loading admin…</div>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
