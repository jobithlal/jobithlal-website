import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { storageConfigured } from "@/lib/media";
import { PageHeader } from "@/components/admin/kit";
import { ProjectForm } from "../PortfolioClient";
import { emptyProject } from "../load";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const user = await requirePage("portfolio:edit");
  const db = requireDb();
  const [categories, count] = await Promise.all([db.projectCategory.findMany({ orderBy: { order: "asc" } }), db.project.count()]);
  return (
    <>
      <PageHeader back={{ href: "/admin/portfolio", label: "Portfolio" }} title="New project" description="Saved as a draft until you publish it." />
      <ProjectForm v={emptyProject(categories[0]?.id ?? "", count)} categories={categories} canPublish={can(user.role, "portfolio:publish")} storageReady={storageConfigured()} />
    </>
  );
}
