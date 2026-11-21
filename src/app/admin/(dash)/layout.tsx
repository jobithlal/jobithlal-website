import { Suspense } from "react";
import { requirePage } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/permissions";
import { AdminShell } from "@/components/admin/AdminShell";

async function Gate({ children }: { children: React.ReactNode }) {
  const user = await requirePage("dashboard:view");
  return <AdminShell user={{ name: user.name, email: user.email, roleLabel: roleLabels[user.role] }}>{children}</AdminShell>;
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-muted">Loading admin…</div>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
