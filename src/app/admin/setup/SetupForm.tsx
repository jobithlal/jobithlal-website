"use client";

import { useActionState } from "react";
import { setupFirstAdmin, type FormState } from "../actions/auth";
import { ActionForm, Notice, SubmitButton, TextField } from "@/components/admin/ui";

export function SetupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(setupFirstAdmin, {});
  const fe = state.fieldErrors ?? {};
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <TextField label="Setup token" name="setupToken" type="password" autoComplete="off" errors={fe.setupToken} hint="The ADMIN_SETUP_TOKEN value from the server environment." required />
      <TextField label="Your name" name="name" autoComplete="name" errors={fe.name} required />
      <TextField label="Email" name="email" type="email" autoComplete="username" errors={fe.email} required />
      <TextField label="Password" name="password" type="password" autoComplete="new-password" errors={fe.password} hint="At least 12 characters, mixing letters with numbers or symbols." required />
      <TextField label="Confirm password" name="confirm" type="password" autoComplete="new-password" errors={fe.confirm} required />
      <SubmitButton>Create account</SubmitButton>
    </ActionForm>
  );
}
