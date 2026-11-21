import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { storageConfigured } from "@/lib/media";
import { PageHeader } from "@/components/admin/kit";
import { ProjectForm } from "../PortfolioClient";
import { loadProjectForm } from "../load";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: PageProps<"/admin/portfolio/[id]">) {
  const user = await requirePage("portfolio:view");
  const { id } = await params;
  const [v, categories] = await Promise.all([loadProjectForm(id), requireDb().projectCategory.findMany({ orderBy: { order: "asc" } })]);
  if (!v) notFound();
  const canEdit = can(user.role, "portfolio:edit");
  return (
    <>
      <PageHeader
        back={{ href: "/admin/portfolio", label: "Portfolio" }}
        title={v.title}
        description={
          v.publicSlug ? (
            <a href={`/work/${v.publicSlug}`} target="_blank" rel="noopener" className="text-accent hover:underline">
              View on website ↗
            </a>
          ) : (
            "Draft — not visible on the website."
          )
        }
      />
      {canEdit ? (
        <ProjectForm v={v} categories={categories} canPublish={can(user.role, "portfolio:publish")} storageReady={storageConfigured()} />
      ) : (
        <p className="rounded-lg border border-line p-4 text-sm text-fg-2">Your role can view projects but not edit them. Use Preview to see the page.</p>
      )}
    </>
  );
}
