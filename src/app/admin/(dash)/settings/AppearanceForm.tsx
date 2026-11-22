"use client";

import { useState } from "react";
import { saveAppearance } from "@/app/admin/actions/settings";
import { Btn, Card, useActionForm } from "@/components/admin/kit";
import type { AppearanceSettings } from "@/content/schema";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "dark", label: "Dark", hint: "Black and neon green — the original look." },
  { value: "light", label: "Light", hint: "Light background, dark text, neon accents." },
  { value: "toggle", label: "Visitor’s choice", hint: "A sun/moon button in the header lets visitors switch." },
] as const;

const DEFAULTS = [
  { value: "system", label: "Match their device" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
] as const;

/** Mini preview of a page in each theme. Colours mirror the site's tokens. */
function Swatch({ theme }: { theme: "dark" | "light" | "toggle" }) {
  const half = (t: "dark" | "light") => (
    <div className={cn("flex flex-1 flex-col gap-1.5 p-2.5", t === "dark" ? "bg-[#080a08]" : "bg-[#f4f5ef]")}>
      <span className={cn("h-1.5 w-8 rounded-full", t === "dark" ? "bg-[#d7ff28]" : "bg-[#3f5c00]")} />
      <span className={cn("h-2 w-14 rounded-sm", t === "dark" ? "bg-white" : "bg-[#0b0d0b]")} />
      <span className={cn("h-1.5 w-11 rounded-sm", t === "dark" ? "bg-[#b5bbb5]" : "bg-[#444b44]")} />
      <span className="mt-1 h-3 w-9 rounded-full bg-[#d7ff28]" />
    </div>
  );
  return (
    <div aria-hidden className="flex h-20 overflow-hidden rounded-lg border border-line">
      {theme === "toggle" ? (
        <>
          {half("dark")}
          {half("light")}
        </>
      ) : (
        half(theme)
      )}
    </div>
  );
}

export function AppearanceForm({ v, canEdit }: { v: AppearanceSettings; canEdit: boolean }) {
  const [mode, setMode] = useState(v.mode);
  const { formProps, pending } = useActionForm(saveAppearance, { trackDirty: true });
  return (
    <Card title="Appearance" description="Colour theme of the public website. The admin always stays dark.">
      <form {...formProps}>
        <fieldset disabled={!canEdit} className="space-y-5">
          <legend className="sr-only">Website theme</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((m) => (
              <label
                key={m.value}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                  mode === m.value ? "border-accent bg-accent/5" : "border-line hover:border-fg-2",
                )}
              >
                <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="sr-only" />
                <Swatch theme={m.value} />
                <span className="mt-3 flex items-center justify-between text-sm font-semibold">
                  {m.label}
                  {mode === m.value && <span className="text-xs font-medium text-accent">Selected</span>}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{m.hint}</span>
              </label>
            ))}
          </div>

          {mode === "toggle" ? (
            <div>
              <p className="text-sm font-medium">First-time visitors see</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEFAULTS.map((d) => (
                  <label key={d.value} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm has-[:checked]:border-accent has-[:checked]:text-accent">
                    <input type="radio" name="toggleDefault" value={d.value} defaultChecked={v.toggleDefault === d.value} className="accent-[#d7ff28]" />
                    {d.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Once a visitor switches, their choice is remembered on that device.</p>
            </div>
          ) : (
            <input type="hidden" name="toggleDefault" value={v.toggleDefault} />
          )}

          {canEdit ? (
            <Btn type="submit" variant="primary" pending={pending}>
              Save appearance
            </Btn>
          ) : (
            <p className="text-xs text-muted">Only the Super Admin can change this.</p>
          )}
        </fieldset>
      </form>
    </Card>
  );
}
