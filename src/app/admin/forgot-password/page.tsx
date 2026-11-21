"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "../actions/auth";
import { ActionForm, AuthCard, Notice, SubmitButton, TextField } from "@/components/admin/ui";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to set a new one.">
      {state.message ? (
        <Notice tone="success">{state.message}</Notice>
      ) : (
        <ActionForm action={action} pending={pending} className="space-y-4">
          {state.error && <Notice tone="error">{state.error}</Notice>}
          <TextField label="Email" name="email" type="email" autoComplete="username" errors={state.fieldErrors?.email} required autoFocus />
          <SubmitButton>Send reset link</SubmitButton>
        </ActionForm>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/admin/login" className="text-fg-2 underline-offset-4 hover:text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
