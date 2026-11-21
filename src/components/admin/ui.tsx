"use client";

import { createContext, startTransition, useContext, useId, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Functional admin form primitives — simpler than the public site, same tokens. */

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center font-display text-2xl font-bold">
          <span className="text-accent">/</span>JOBITHLAL <span className="text-sm font-medium text-muted">Admin</span>
        </p>
        <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-fg-2">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function TextField({
  label,
  name,
  type = "text",
  errors,
  hint,
  ...rest
}: { label: string; name: string; type?: string; errors?: string[]; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  const id = useId();
  const err = errors?.[0];
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg-2">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${id}-e` : hint ? `${id}-h` : undefined}
        className="h-11 w-full rounded-lg border border-line bg-bg-2 px-3.5 text-fg outline-none transition-colors focus:border-accent aria-[invalid=true]:border-[#ff8a7a]"
        {...rest}
      />
      {hint && !err && (
        <p id={`${id}-h`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {err && (
        <p id={`${id}-e`} className="mt-1.5 text-xs text-[#ffb4a8]">
          {err}
        </p>
      )}
    </div>
  );
}

const PendingContext = createContext(false);

/**
 * Form that submits through a useActionState dispatcher via onSubmit, so React
 * doesn't clear the fields when the server returns a validation error.
 */
export function ActionForm({
  action,
  pending,
  children,
  className,
}: {
  action: (fd: FormData) => void;
  pending: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PendingContext.Provider value={pending}>
      <form
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        {children}
      </form>
    </PendingContext.Provider>
  );
}

export function SubmitButton({ children, className }: { children: ReactNode; className?: string }) {
  const pending = useContext(PendingContext);
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-ink transition-opacity disabled:opacity-60",
        className,
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3.5 py-3 text-sm",
        tone === "error" && "border-[#ff8a7a]/40 bg-[#ff8a7a]/5 text-[#ffb4a8]",
        tone === "success" && "border-accent/40 bg-accent/5 text-accent",
        tone === "info" && "border-line bg-bg-2 text-fg-2",
      )}
    >
      {children}
    </p>
  );
}
