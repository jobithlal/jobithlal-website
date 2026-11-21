"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "../actions/auth";
import { ActionForm, Notice, SubmitButton, TextField } from "@/components/admin/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && !state.error && <Notice tone="info">{state.message}</Notice>}
      <TextField label="Email" name="email" type="email" autoComplete="username" required autoFocus />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      {state.needsTotp && (
        <TextField label="Authentication code" name="totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus />
      )}
      <SubmitButton>Sign in</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/admin/forgot-password" className="text-fg-2 underline-offset-4 hover:text-accent hover:underline">
          Forgot your password?
        </Link>
      </p>
    </ActionForm>
  );
}
