"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { createService, deleteService } from "@/app/admin/actions/services";
import { Btn, Card, ConfirmButton, Input, Select, useActionForm, useToast } from "@/components/admin/kit";
import { SERVICE_ICONS } from "@/content/service-map";

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export function NewServiceForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const { formProps, pending, errors: e } = useActionForm(createService, {
    onSuccess: (r) => r.data && router.push(`/admin/services/${r.data.slug}`),
  });

  if (!open) {
    return (
      <Btn type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> New service
      </Btn>
    );
  }
  return (
    <Card title="New service" description="It starts switched off. Write its card and landing page, then switch it on to publish.">
      <form {...formProps} className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Service name"
          name="title"
          value={title}
          onChange={(ev) => {
            setTitle(ev.target.value);
            if (!slugTouched) setSlug(toSlug(ev.target.value));
          }}
          placeholder="Portrait Design"
          errors={e.title}
          autoFocus
        />
        <Input
          label="Web address"
          name="slug"
          value={slug}
          onChange={(ev) => {
            setSlugTouched(true);
            setSlug(toSlug(ev.target.value));
          }}
          hint={slug ? `/services/${slug}` : "Filled in from the name."}
          errors={e.slug}
        />
        <Select label="Icon" name="icon" defaultValue="sparkles" options={SERVICE_ICONS.map((i) => ({ value: i.value, label: i.label }))} />
        <div className="flex gap-3 sm:col-span-3">
          <Btn type="submit" pending={pending}>
            Create service
          </Btn>
          <Btn type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Btn>
        </div>
      </form>
    </Card>
  );
}

export function DeleteServiceButton({ slug, title, afterDelete }: { slug: string; title: string; afterDelete?: string }) {
  const toast = useToast();
  const router = useRouter();
  return (
    <ConfirmButton
      label="Delete"
      title={`Delete “${title}”?`}
      body="The service card and its landing page are removed from the website. Its portfolio category is removed too; this is refused while real projects still use it. This can't be undone."
      confirmLabel="Delete service"
      onConfirm={async () => {
        const r = await deleteService(slug);
        toast({ tone: r.ok ? "success" : "error", text: r.ok ? (r.message ?? "Deleted.") : r.error });
        if (r.ok && afterDelete) router.push(afterDelete);
      }}
    />
  );
}
