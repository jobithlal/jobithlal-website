"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { FolderPlus } from "lucide-react";
import { createFolder, deleteMediaAsset, updateMediaAsset } from "@/app/admin/actions/media";
import { Btn, ConfirmButton, Input, Select, Textarea, useActionForm, useToast } from "@/components/admin/kit";
import { Uploader } from "@/components/admin/Uploader";

export function MediaUploadPanel({ folderId }: { folderId: string | null }) {
  const router = useRouter();
  return <Uploader folderId={folderId} onUploaded={() => router.refresh()} />;
}

export function NewFolder() {
  const ref = useRef<HTMLDialogElement>(null);
  const { formProps, pending, errors } = useActionForm(createFolder, { resetOnSuccess: true, onSuccess: () => ref.current?.close() });
  return (
    <>
      <Btn type="button" onClick={() => ref.current?.showModal()}>
        <FolderPlus className="size-4" aria-hidden /> New folder
      </Btn>
      <dialog ref={ref} className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-line bg-card p-6 text-fg backdrop:bg-black/70">
        <form {...formProps} className="space-y-4">
          <h2 className="font-display text-lg font-bold">New folder</h2>
          <Input label="Folder name" name="name" errors={errors.name} required autoFocus />
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="ghost" onClick={() => ref.current?.close()}>
              Cancel
            </Btn>
            <Btn type="submit" variant="primary" pending={pending}>
              Create
            </Btn>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function MediaDetailsForm({
  id,
  label,
  alt,
  folderId,
  folders,
  canEdit,
  canDelete,
  inUse,
}: {
  id: string;
  label: string;
  alt: string;
  folderId: string | null;
  folders: { id: string; name: string }[];
  canEdit: boolean;
  canDelete: boolean;
  inUse: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const { formProps, pending, errors } = useActionForm(updateMediaAsset.bind(null, id), { trackDirty: true });
  return (
    <div className="space-y-4">
      <form {...formProps} className="space-y-4">
        <fieldset disabled={!canEdit} className="space-y-4 disabled:opacity-70">
          <Input label="Label" name="label" defaultValue={label} errors={errors.label} hint="Internal name used to find the file." />
          <Textarea
            label="Alt text"
            name="alt"
            rows={3}
            defaultValue={alt}
            errors={errors.alt}
            hint="Describe the image for people using screen readers. Leave empty only for purely decorative images."
          />
          <Select label="Folder" name="folderId" defaultValue={folderId ?? ""} options={[{ value: "", label: "No folder" }, ...folders.map((f) => ({ value: f.id, label: f.name }))]} />
        </fieldset>
        {canEdit && (
          <Btn type="submit" variant="primary" pending={pending}>
            Save details
          </Btn>
        )}
      </form>
      {canDelete && (
        <div className="border-t border-line pt-4">
          {inUse ? (
            <p className="text-sm text-muted">This file is in use, so it can&apos;t be deleted. Replace it where it&apos;s used first.</p>
          ) : (
            <ConfirmButton
              label="Delete file"
              title="Delete this file?"
              body="It will be removed from the library and from storage. This can't be undone."
              onConfirm={async () => {
                const r = await deleteMediaAsset(id);
                if (r.ok) {
                  toast({ tone: "success", text: r.message ?? "Deleted." });
                  router.push("/admin/media");
                } else toast({ tone: "error", text: r.error });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function CopyUrl({ url }: { url: string }) {
  const toast = useToast();
  return (
    <Btn
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast({ tone: "success", text: "URL copied." });
        } catch {
          toast({ tone: "error", text: "Couldn't copy — select the URL and copy it manually." });
        }
      }}
    >
      Copy URL
    </Btn>
  );
}
