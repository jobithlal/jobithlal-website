import Link from "next/link";
import { AuthCard } from "@/components/admin/ui";

export default function NoAccess() {
  return (
    <AuthCard title="No access" subtitle="Your role doesn't include permission for that page. Ask a Super Admin if you need it.">
      <Link href="/admin" className="block text-center text-sm text-accent underline-offset-4 hover:underline">
        Back to overview
      </Link>
    </AuthCard>
  );
}
