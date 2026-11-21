import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { AuthCard, Notice } from "@/components/admin/ui";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "First-time setup" };

async function SetupGate() {
  await connection();
  if (!db) {
    return <Notice tone="info">Connect a database first: set DATABASE_URL, then run <code>npm run db:deploy</code> and <code>npm run db:seed</code>.</Notice>;
  }
  if ((await db.user.count()) > 0) {
    return (
      <div className="space-y-4">
        <Notice tone="info">Setup is complete — an administrator account already exists.</Notice>
        <Link href="/admin/login" className="block text-center text-sm text-accent underline-offset-4 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }
  if (!process.env.ADMIN_SETUP_TOKEN || process.env.ADMIN_SETUP_TOKEN.length < 16) {
    return (
      <Notice tone="info">
        Setup is locked. Add <code>ADMIN_SETUP_TOKEN</code> (any secret of 16+ characters) to the server environment, restart, then reload this page. Alternatively run <code>npm run admin:create</code> on the server.
      </Notice>
    );
  }
  return <SetupForm />;
}

export default function SetupPage() {
  return (
    <AuthCard title="Create the Super Admin" subtitle="One-time setup. This page locks itself as soon as the first account exists.">
      <Suspense fallback={<p className="text-sm text-muted">Checking setup status…</p>}>
        <SetupGate />
      </Suspense>
    </AuthCard>
  );
}
