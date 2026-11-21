import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/admin/kit";
import { dateFmt } from "@/lib/admin/format";
import { NewUser, UserRow } from "./UsersClient";

export const metadata: Metadata = { title: "Users & security" };

export default async function UsersPage() {
  const me = await requirePage("users:manage");
  const users = await requireDb().user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { sessions: true } } },
  });
  return (
    <>
      <PageHeader
        title="Users & security"
        description="Who can access the admin, and what they can do. There is no public sign-up."
        actions={
          <Link href="/admin/account" className="inline-flex h-10 items-center rounded-lg border border-line bg-bg-2 px-4 text-sm font-semibold hover:border-fg-2/50">
            My account &amp; 2FA
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {users.map((u) => (
            <UserRow
              key={u.id}
              isMe={u.id === me.id}
              u={{
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                active: u.active,
                totp: u.totpEnabled,
                sessions: u._count.sessions,
                lastLogin: u.lastLoginAt ? dateFmt.format(u.lastLoginAt) : "Never",
                locked: Boolean(u.lockedUntil && u.lockedUntil > new Date()),
              }}
            />
          ))}
        </div>
        <div className="space-y-6">
          <NewUser />
          <Card title="Roles">
            <dl className="space-y-3 text-sm">
              {(
                [
                  ["SUPER_ADMIN", "Everything, including users, settings and security."],
                  ["EDITOR", "Pages, services, portfolio, media and inquiries."],
                  ["VIEWER", "Read-only access to the dashboard and content."],
                ] as const
              ).map(([r, d]) => (
                <div key={r}>
                  <dt>
                    <Badge tone={r === "SUPER_ADMIN" ? "accent" : "neutral"}>{roleLabels[r]}</Badge>
                  </dt>
                  <dd className="mt-1 text-fg-2">{d}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
