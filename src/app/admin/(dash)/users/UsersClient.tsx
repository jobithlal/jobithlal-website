"use client";

import { useState, useTransition } from "react";
import { createUser, deleteUser, signOutUserEverywhere, updateUser } from "@/app/admin/actions/users";
import { Badge, Btn, Card, ConfirmButton, Input, Select, Toggle, useActionForm, useToast } from "@/components/admin/kit";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Viewer" },
];

export function NewUser() {
  const [temp, setTemp] = useState<string | null>(null);
  const { formProps, pending, errors } = useActionForm(createUser, {
    resetOnSuccess: true,
    onSuccess: (r) => setTemp(r.data?.tempPassword ?? null),
  });
  return (
    <Card title="Add a user">
      <form {...formProps} className="space-y-3">
        <Input label="Name" name="name" errors={errors.name} />
        <Input label="Email" name="email" type="email" errors={errors.email} />
        <Select label="Role" name="role" defaultValue="EDITOR" options={ROLE_OPTIONS} />
        <Btn type="submit" variant="primary" pending={pending}>
          Add user
        </Btn>
      </form>
      {temp && (
        <div className="mt-4 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm" role="status">
          <p className="font-semibold">Temporary password (shown once):</p>
          <code className="mt-1 block select-all break-all rounded bg-bg-2 p-2">{temp}</code>
          <p className="mt-2 text-xs text-fg-2">Share it privately. They should change it under My account after signing in.</p>
        </div>
      )}
    </Card>
  );
}

type U = { id: string; name: string; email: string; role: string; active: boolean; totp: boolean; sessions: number; lastLogin: string; locked: boolean };

export function UserRow({ u, isMe }: { u: U; isMe: boolean }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const { formProps, pending: saving, errors } = useActionForm(updateUser.bind(null, u.id));
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {u.name} {isMe && <span className="text-xs font-normal text-muted">(you)</span>}
          </p>
          <p className="text-sm text-fg-2">{u.email}</p>
          <p className="mt-1 flex flex-wrap gap-2 text-xs">
            <Badge tone={u.role === "SUPER_ADMIN" ? "accent" : "neutral"}>{ROLE_OPTIONS.find((r) => r.value === u.role)?.label}</Badge>
            {!u.active && <Badge tone="danger">Deactivated</Badge>}
            {u.locked && <Badge tone="warn">Temporarily locked</Badge>}
            <Badge tone={u.totp ? "accent" : "muted"}>{u.totp ? "2FA on" : "2FA off"}</Badge>
            <span className="text-muted">
              Last sign-in {u.lastLogin} · {u.sessions} active session{u.sessions === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <Btn type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Close" : "Manage"}
        </Btn>
      </div>
      {open && (
        <div className="mt-4 border-t border-line pt-4">
          <form {...formProps} className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <Input label="Name" name="name" defaultValue={u.name} errors={errors.name} />
            <Select label="Role" name="role" defaultValue={u.role} options={ROLE_OPTIONS} disabled={isMe} />
            {isMe && <input type="hidden" name="role" value={u.role} />}
            <div className="pb-2">{isMe ? <input type="hidden" name="active" value="true" /> : <Toggle label="Active" name="active" defaultChecked={u.active} />}</div>
            <div className="flex flex-wrap gap-2 sm:col-span-3">
              <Btn type="submit" variant="primary" pending={saving}>
                Save
              </Btn>
              {!isMe && (
                <Btn
                  type="button"
                  pending={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await signOutUserEverywhere(u.id);
                      toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
                    })
                  }
                >
                  Sign out everywhere
                </Btn>
              )}
              {!isMe && (
                <ConfirmButton
                  label="Delete user"
                  title={`Delete ${u.name}?`}
                  body="They lose access immediately. Notes and activity they created are kept."
                  onConfirm={async () => {
                    const r = await deleteUser(u.id);
                    toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
                  }}
                />
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
