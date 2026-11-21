"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addInquiryNote, deleteInquiry, deleteInquiryNote, setInquiryRead, setInquiryStatus } from "@/app/admin/actions/inquiries";
import { Btn, ConfirmButton, Textarea, useActionForm, useToast } from "@/components/admin/kit";
import { statusLabels } from "../labels";

export function InquiryControls({
  inquiryId,
  status,
  read,
  canManage,
  canDelete,
}: {
  inquiryId: string;
  status: keyof typeof statusLabels;
  read: boolean;
  canManage: boolean;
  canDelete: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (p: Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await p;
      toast({ tone: r.ok ? "success" : "error", text: (r.ok ? r.message : r.error) ?? "" });
    });

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-fg-2">Pipeline status</span>
        <select
          defaultValue={status}
          disabled={!canManage || pending}
          onChange={(e) => run(setInquiryStatus(inquiryId, e.target.value))}
          className="h-10 w-full rounded-lg border border-line bg-bg-2 px-3 text-sm disabled:opacity-60"
        >
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        {canManage && read && (
          <Btn type="button" pending={pending} onClick={() => run(setInquiryRead(inquiryId, false))}>
            Mark as unread
          </Btn>
        )}
        {canDelete && (
          <ConfirmButton
            label="Delete"
            title="Delete this inquiry?"
            body="The inquiry and its notes will be permanently removed. This can't be undone."
            onConfirm={async () => {
              const r = await deleteInquiry(inquiryId);
              if (r.ok) {
                toast({ tone: "success", text: r.message ?? "Deleted." });
                router.push("/admin/inquiries");
              } else toast({ tone: "error", text: r.error });
            }}
          />
        )}
      </div>
      {!canManage && <p className="text-xs text-muted">Your role can view inquiries but not change them.</p>}
    </div>
  );
}

export function NoteForm({ inquiryId }: { inquiryId: string }) {
  const { formProps, pending, errors } = useActionForm(addInquiryNote.bind(null, inquiryId), { resetOnSuccess: true });
  return (
    <form {...formProps} className="space-y-2">
      <Textarea label="Add a note" name="body" rows={3} errors={errors.body} placeholder="Call notes, quotes sent, next steps…" />
      <Btn type="submit" variant="primary" pending={pending}>
        Save note
      </Btn>
    </form>
  );
}

export function NoteDelete({ noteId }: { noteId: string }) {
  const toast = useToast();
  return (
    <ConfirmButton
      label="Delete"
      variant="ghost"
      className="h-7 px-2 text-xs"
      title="Delete this note?"
      body="This can't be undone."
      onConfirm={async () => {
        const r = await deleteInquiryNote(noteId);
        toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "") : r.error });
      }}
    />
  );
}
