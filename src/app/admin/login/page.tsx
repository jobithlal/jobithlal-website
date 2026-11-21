import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AuthCard } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" subtitle="Admin access for the JOBITHLAL website.">
      <LoginForm />
    </AuthCard>
  );
}
