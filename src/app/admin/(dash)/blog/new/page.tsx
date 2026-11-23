import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { requireDb } from "@/lib/db";
import { storageConfigured } from "@/lib/media";
import { PageHeader } from "@/components/admin/kit";
import { ArticleForm } from "../BlogClient";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  const user = await requirePage("content:edit");
  const categories = await requireDb().blogCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return (
    <>
      <PageHeader back={{ href: "/admin/blog", label: "Blog" }} title="New article" description="Saved as a draft until you publish it. Drafts never appear on the website or in the sitemap." />
      <ArticleForm
        v={{
          id: null,
          title: "",
          slug: "",
          categoryId: categories[0]?.id ?? "",
          excerpt: "",
          content: "## First section\n\nStart writing here.\n",
          cover: null,
          coverUrl: "",
          coverAlt: "",
          featured: false,
          seoTitle: "",
          seoDescription: "",
          publishedAt: "",
          status: "DRAFT",
        }}
        categories={categories}
        canPublish={can(user.role, "content:publish")}
        storageReady={storageConfigured()}
      />
    </>
  );
}
