"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { changeMyPassword, confirmTotp, disableTotp, revokeMySession, startTotpSetup } from "@/app/admin/actions/users";
import { Btn, Input, useActionForm, useToast } from "@/components/admin/kit";

export function PasswordForm() {
  const { formProps, pending, errors } = useActionForm(changeMyPassword, { resetOnSuccess: true });
  return (
    <form {...formProps} className="space-y-3">
      <Input label="Current password" name="current" type="password" autoComplete="current-password" errors={errors.current} />
      <Input label="New password" name="password" type="password" autoComplete="new-password" errors={errors.password} hint="At least 12 characters, mixing letters with numbers or symbols." />
      <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" errors={errors.confirm} />
      <Btn type="submit" variant="primary" pending={pending}>
        Change password
      </Btn>
    </form>
  );
}

export function TwoFactor({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const confirm = useActionForm(confirmTotp, { onSuccess: () => setSetup(null) });
  const disable = useActionForm(disableTotp, { resetOnSuccess: true });

  useEffect(() => {
    if (setup) QRCode.toDataURL(setup.uri, { margin: 1, width: 220, color: { dark: "#080A08", light: "#FFFFFF" } }).then(setQr);
  }, [setup]);

  if (enabled) {
    return (
      <form {...disable.formProps} className="space-y-3">
        <p className="text-sm text-accent">Two-step sign-in is on.</p>
        <Input label="Current password (to turn it off)" name="current" type="password" autoComplete="current-password" errors={disable.errors.current} />
        <Btn type="submit" variant="danger" pending={disable.pending}>
          Turn off
        </Btn>
      </form>
    );
  }
  if (!setup) {
    return (
      <Btn
        type="button"
        variant="primary"
        pending={pending}
        onClick={() =>
          start(async () => {
            const r = await startTotpSetup();
            if (r.ok && r.data) setSetup(r.data);
            else if (!r.ok) toast({ tone: "error", text: r.error });
          })
        }
      >
        Set up two-step sign-in
      </Btn>
    );
  }
  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-fg-2">
        <li>Scan this QR code with your authenticator app.</li>
        <li>Enter the 6-digit code it shows to confirm.</li>
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated QR data URL */}
      {qr && <img src={qr} alt="QR code for your authenticator app" width={220} height={220} className="rounded-lg" />}
      <p className="text-xs text-muted">
        Can&apos;t scan? Enter this key manually: <code className="select-all break-all text-fg">{setup.secret}</code>
      </p>
      <form {...confirm.formProps} className="flex flex-wrap items-end gap-2">
        <Input label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} errors={confirm.errors.code} />
        <Btn type="submit" variant="primary" pending={confirm.pending}>
          Confirm
        </Btn>
      </form>
    </div>
  );
}

export function SessionRevoke({ id }: { id: string }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Btn
      type="button"
      pending={pending}
      className="h-8 px-3 text-xs"
      onClick={() =>
        start(async () => {
          const r = await revokeMySession(id);
          toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
        })
      }
    >
      Sign out
    </Btn>
  );
}
