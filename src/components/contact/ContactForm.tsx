"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Mail, MessageCircle, AlertTriangle } from "lucide-react";
import { submitInquiry } from "@/app/actions/contact";
import { track } from "@/components/analytics/Analytics";
import { budgetOptions, serviceOptions, timelineOptions, type ContactState } from "@/lib/contact-schema";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const initial: ContactState = { status: "idle" };

const subscribeNoop = () => () => {};
function readServiceParam() {
  const svc = new URLSearchParams(window.location.search).get("service") ?? "";
  return serviceOptions.some((o) => o.value === svc) ? svc : "";
}

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2);
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitInquiry, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const submissionKey = useRef("");
  // Pre-select the service from ?service=… (links on the service pages).
  const defaultService = useSyncExternalStore(subscribeNoop, readServiceParam, () => "");

  useEffect(() => {
    startedAt.current = Date.now();
    submissionKey.current = newKey();
  }, []);

  const lastService = useRef("");
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
    // Conversion event (only sent if the visitor accepted analytics).
    if (state.status === "success") track("contact_submit", { service: lastService.current });
  }, [state]);

  const errors = state.status === "invalid" ? state.fieldErrors : {};

  if (state.status === "success") {
    return (
      <motion.div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-5 rounded-[var(--radius-card)] border border-accent/40 bg-card p-8 outline-none sm:p-10"
      >
        <CheckCircle2 className="size-10 text-accent" aria-hidden />
        <p className="font-display text-2xl font-bold">{state.message}</p>
        <p className="text-fg-2">I&apos;ve received your inquiry and will reply by email. If it&apos;s urgent, WhatsApp is the fastest way to reach me.</p>
      </motion.div>
    );
  }

  return (
    <form
      ref={formRef}
      // Submitting via onSubmit (not the action prop) keeps the visitor's input if validation fails.
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        fd.set("startedAt", String(startedAt.current));
        fd.set("sourcePage", window.location.pathname);
        lastService.current = String(fd.get("service") ?? "");
        fd.set("submissionKey", submissionKey.current);
        startTransition(() => action(fd));
      }}
      noValidate className="space-y-5" aria-describedby="form-status">
      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" errors={errors.name} />
        <Field label="Email address" name="email" type="email" required autoComplete="email" errors={errors.email} />
        <Field label="Company name" name="company" autoComplete="organization" errors={errors.company} />
        <Field label="Phone / WhatsApp" name="phone" type="tel" autoComplete="tel" errors={errors.phone} />
      </div>

      <SelectField label="Service interested in" name="service" required errors={errors.service} defaultValue={defaultService} key={defaultService}>
        <option value="" disabled>
          Choose a service
        </option>
        {serviceOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Budget range" name="budget" errors={errors.budget} defaultValue="">
          <option value="">Select (optional)</option>
          {budgetOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </SelectField>
        <SelectField label="Expected timeline" name="timeline" errors={errors.timeline} defaultValue="">
          <option value="">Select (optional)</option>
          {timelineOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </SelectField>
      </div>

      <Field label="Project details" name="details" required textarea errors={errors.details} placeholder="Goals, audience, deliverables, references…" />

      <div id="form-status" ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        <AnimatePresence>
          {(state.status === "invalid" || state.status === "error" || state.status === "unavailable") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "overflow-hidden rounded-2xl border p-5 text-sm",
                state.status === "invalid" ? "border-[#ff8a7a]/40 text-[#ffb4a8]" : "border-accent/40 text-fg-2",
              )}
              role={state.status === "invalid" ? "alert" : "status"}
            >
              <p className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {state.message}
              </p>
              {"fallback" in state && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={state.fallback.mailto} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-semibold text-ink">
                    <Mail className="size-4" aria-hidden /> Send by email
                  </a>
                  <a
                    href={state.fallback.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 font-semibold text-fg hover:border-accent"
                  >
                    <MessageCircle className="size-4" aria-hidden /> Send on WhatsApp
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Fields marked <span className="text-accent">*</span> are required. Your details are used only to reply to your inquiry.
        </p>
        <Button type="submit" disabled={pending} icon={pending ? "none" : "arrow"} className="w-full sm:w-auto" aria-disabled={pending}>
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
            </span>
          ) : (
            "Send inquiry"
          )}
        </Button>
      </div>
    </form>
  );
}

const inputCls =
  "peer w-full rounded-2xl border border-line bg-bg-2 px-5 text-fg placeholder:text-muted/70 transition-colors hover:border-fg-2/40 focus:border-accent focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-[#ff8a7a]/70";

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-fg-2">
      {children}
      {required && (
        <span className="text-accent" aria-hidden>
          {" "}
          *
        </span>
      )}
    </label>
  );
}

function ErrorText({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-2 text-sm text-[#ffb4a8]">
      {errors[0]}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
  errors,
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  errors?: string[];
  autoComplete?: string;
  placeholder?: string;
}) {
  const id = useId();
  const errId = `${id}-err`;
  const common = {
    id,
    name,
    required,
    "aria-required": required,
    "aria-invalid": errors?.length ? true : undefined,
    "aria-describedby": errors?.length ? errId : undefined,
    autoComplete,
    placeholder,
  };
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {textarea ? (
        <textarea {...common} rows={6} maxLength={5000} className={cn(inputCls, "min-h-40 resize-y py-4")} />
      ) : (
        <input {...common} type={type} className={cn(inputCls, "h-14")} />
      )}
      <ErrorText id={errId} errors={errors} />
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  errors,
  children,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  errors?: string[];
  children: React.ReactNode;
  defaultValue?: string;
}) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <select
          id={id}
          name={name}
          required={required}
          aria-required={required}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={errors?.length ? errId : undefined}
          defaultValue={defaultValue}
          className={cn(inputCls, "h-14 appearance-none pr-12")}
        >
          {children}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-accent">
          ▾
        </span>
      </div>
      <ErrorText id={errId} errors={errors} />
    </div>
  );
}
