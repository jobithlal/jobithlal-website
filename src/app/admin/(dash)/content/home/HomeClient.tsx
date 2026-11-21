"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { moveSection, publishAllDrafts, restoreRevision, setSectionVisible } from "@/app/admin/actions/content";
import { Btn, ConfirmButton, useToast } from "@/components/admin/kit";

type R = { ok: boolean; message?: string; error?: string };

function useRun() {
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = (p: Promise<R>) =>
    start(async () => {
      const r = await p;
      if (!r.ok || r.message) toast({ tone: r.ok ? "success" : "error", text: (r.ok ? r.message : r.error) ?? "" });
    });
  return { pending, run };
}

export function SectionRowControls({ sectionKey, visible, first, last }: { sectionKey: string; visible: boolean; first: boolean; last: boolean }) {
  const { pending, run } = useRun();
  return (
    <div className="flex gap-1">
      <Btn type="button" variant="ghost" className="h-9 px-2" disabled={pending} aria-label={visible ? "Hide section" : "Show section"} onClick={() => run(setSectionVisible(sectionKey, !visible))}>
        {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </Btn>
      <Btn type="button" variant="ghost" className="h-9 px-2" disabled={first || pending} aria-label="Move up" onClick={() => run(moveSection(sectionKey, "up"))}>
        <ArrowUp className="size-4" />
      </Btn>
      <Btn type="button" variant="ghost" className="h-9 px-2" disabled={last || pending} aria-label="Move down" onClick={() => run(moveSection(sectionKey, "down"))}>
        <ArrowDown className="size-4" />
      </Btn>
    </div>
  );
}

export function PublishAll({ count }: { count: number }) {
  const { pending, run } = useRun();
  return (
    <Btn type="button" variant="primary" pending={pending} disabled={count === 0} onClick={() => run(publishAllDrafts())}>
      Publish {count > 0 ? `${count} draft${count > 1 ? "s" : ""}` : "drafts"}
    </Btn>
  );
}

export function RestoreRevision({ id }: { id: string }) {
  const toast = useToast();
  return (
    <ConfirmButton
      label="Restore"
      variant="secondary"
      className="mt-2 h-8 px-3 text-xs"
      title="Restore this version?"
      body="Its content is loaded into drafts for every section. Nothing changes on the live site until you publish."
      confirmLabel="Load as drafts"
      onConfirm={async () => {
        const r = await restoreRevision(id);
        toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
      }}
    />
  );
}
