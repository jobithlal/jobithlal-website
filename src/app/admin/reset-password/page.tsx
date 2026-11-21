"use client";

import Link from "next/link";
import { useActionState, useSyncExternalStore } from "react";
import { resetPassword, type FormState } from "../actions/auth";
import { ActionForm, AuthCard, Notice, SubmitButton, TextField } from "@/components/admin/ui";

const noop = () => () => {};
const readToken = () => new URLSearchParams(window.location.search).get("token") ?? "";

export default function ResetPasswordPage() {
  const token = useSyncExternalStore(noop, readToken, () => "");
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const fe = state.fieldErrors ?? {};
  return (
    <AuthCard title="Choose a new password">
      {state.message ? (
        <div className="space-y-4">
          <Notice tone="success">{state.message}</Notice>
          <Link href="/admin/login" className="block text-center text-sm text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      ) : (
        <ActionForm action={action} pending={pending} className="space-y-4">
          {state.error && <Notice tone="error">{state.error}</Notice>}
          <input type="hidden" name="token" value={token} />
          <TextField label="New password" name="password" type="password" autoComplete="new-password" errors={fe.password} hint="At least 12 characters, mixing letters with numbers or symbols." required />
          <TextField label="Confirm password" name="confirm" type="password" autoComplete="new-password" errors={fe.confirm} required />
          <SubmitButton>Update password</SubmitButton>
        </ActionForm>
      )}
    </AuthCard>
  );
}
