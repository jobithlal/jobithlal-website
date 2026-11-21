"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/admin/action";

/* ──────────────────────────── Layout ──────────────────────────── */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-sm text-fg-2 hover:text-accent">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, description }: { children: ReactNode; className?: string; title?: string; description?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-card p-5", className)}>
      {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-fg-2">{description}</p>}
      <div className={title || description ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-fg-2">{children}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warn" | "danger" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-elevated text-fg-2",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "warn" && "bg-[#ffcc66]/15 text-[#ffd98a]",
        tone === "danger" && "bg-[#ff8a7a]/15 text-[#ffb4a8]",
        tone === "muted" && "border border-line text-muted",
      )}
    >
      {children}
    </span>
  );
}

/* ──────────────────────────── Buttons ──────────────────────────── */

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
const btnBase =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-accent text-ink hover:bg-accent-2",
  secondary: "border border-line bg-bg-2 text-fg hover:border-fg-2/50",
  danger: "border border-[#ff8a7a]/40 text-[#ffb4a8] hover:bg-[#ff8a7a]/10",
  ghost: "text-fg-2 hover:bg-elevated hover:text-fg",
};

export function Btn({
  variant = "secondary",
  pending,
  className,
  children,
  ...rest
}: { variant?: BtnVariant; pending?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(btnBase, btnVariants[variant], className)} disabled={pending || rest.disabled} {...rest}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function BtnLink({ variant = "secondary", className, ...rest }: { variant?: BtnVariant } & React.ComponentProps<typeof Link>) {
  return <Link className={cn(btnBase, btnVariants[variant], className)} {...rest} />;
}

/* ──────────────────────────── Fields ──────────────────────────── */

const inputCls =
  "w-full rounded-lg border border-line bg-bg-2 px-3 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-accent aria-[invalid=true]:border-[#ff8a7a]";

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg-2">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs text-[#ffb4a8]">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; name: string; hint?: ReactNode; errors?: string[]; className?: string };

export function Input({ label, name, hint, errors, className, ...rest }: Common & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = useId();
  const err = errors?.[0];
  return (
    <FieldShell id={id} label={label} hint={hint} error={err} className={className}>
      <input id={id} name={name} aria-invalid={err ? true : undefined} aria-describedby={err ? `${id}-err` : undefined} className={cn(inputCls, "h-10")} {...rest} />
    </FieldShell>
  );
}

export function Textarea({ label, name, hint, errors, className, rows = 4, ...rest }: Common & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useId();
  const err = errors?.[0];
  return (
    <FieldShell id={id} label={label} hint={hint} error={err} className={className}>
      <textarea id={id} name={name} rows={rows} aria-invalid={err ? true : undefined} className={cn(inputCls, "resize-y py-2.5 leading-relaxed")} {...rest} />
    </FieldShell>
  );
}

export function Select({
  label,
  name,
  hint,
  errors,
  className,
  options,
  ...rest
}: Common & { options: { value: string; label: string }[] } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = useId();
  const err = errors?.[0];
  return (
    <FieldShell id={id} label={label} hint={hint} error={err} className={className}>
      <select id={id} name={name} aria-invalid={err ? true : undefined} className={cn(inputCls, "h-10")} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Checkbox that always submits a value ("true"/"false") so unchecking is saved. */
export function Toggle({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: ReactNode }) {
  const [on, setOn] = useState(Boolean(defaultChecked));
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input type="hidden" name={name} value={on ? "true" : "false"} />
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors", on ? "border-accent bg-accent" : "border-line bg-bg-2")}
      >
        <span className={cn("absolute top-0.5 size-4.5 rounded-full transition-all", on ? "left-[1.35rem] bg-ink" : "left-0.5 bg-fg-2")} />
      </button>
      <label htmlFor={id} className="text-sm">
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </label>
    </div>
  );
}

/* ──────────────────────────── Toasts ──────────────────────────── */

type Toast = { id: number; tone: "success" | "error"; text: string };
const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all, { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), t.tone === "error" ? 7000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-4 text-sm shadow-2xl",
              t.tone === "success" ? "border-accent/40" : "border-[#ff8a7a]/50",
            )}
          >
            {t.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#ffb4a8]" />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="text-muted hover:text-fg">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ──────────────────────────── Action forms ──────────────────────────── */

/**
 * Runs a server action from a form, keeps the form's values on validation
 * errors, shows a toast, and warns before leaving with unsaved changes.
 */
export function useActionForm<T>(
  action: (fd: FormData) => Promise<ActionResult<T>>,
  opts: { onSuccess?: (r: Extract<ActionResult<T>, { ok: true }>) => void; successMessage?: string; trackDirty?: boolean; resetOnSuccess?: boolean } = {},
) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!opts.trackDirty || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, opts.trackDirty]);

  const submit = (fd: FormData) =>
    start(async () => {
      const r = await action(fd);
      if (r.ok) {
        setErrors({});
        setDirty(false);
        toast({ tone: "success", text: r.message ?? opts.successMessage ?? "Saved." });
        if (opts.resetOnSuccess) formRef.current?.reset();
        opts.onSuccess?.(r);
      } else {
        setErrors(r.fieldErrors ?? {});
        toast({ tone: "error", text: r.error });
      }
    });

  const formProps = {
    ref: formRef,
    noValidate: true,
    onChange: () => setDirty(true),
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (pending) return;
      const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const fd = new FormData(e.currentTarget, submitter);
      submit(fd);
    },
  };
  return { formProps, pending, errors, dirty, submit };
}

/* ──────────────────────────── Confirm dialog ──────────────────────────── */

export function ConfirmButton({
  label,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  variant = "danger",
  className,
}: {
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  variant?: BtnVariant;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <Btn type="button" variant={variant} className={className} onClick={() => ref.current?.showModal()}>
        {label}
      </Btn>
      <dialog
        ref={ref}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-card p-6 text-fg backdrop:bg-black/70"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title" className="font-display text-lg font-bold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-fg-2">{body}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Btn type="button" variant="ghost" onClick={() => ref.current?.close()}>
            Cancel
          </Btn>
          <Btn
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            pending={pending}
            onClick={() =>
              start(async () => {
                await onConfirm();
                ref.current?.close();
              })
            }
          >
            {confirmLabel}
          </Btn>
        </div>
      </dialog>
    </>
  );
}
