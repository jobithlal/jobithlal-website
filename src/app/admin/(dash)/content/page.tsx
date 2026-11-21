import { redirect } from "next/navigation";
import { requirePage } from "@/lib/auth/session";

export default async function ContentIndex() {
  await requirePage("content:view");
  redirect("/admin/content/home");
}
