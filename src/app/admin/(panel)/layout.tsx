import { AdminLayoutClient } from "@/components/admin/AdminSidebar";
import { getSettings } from "@/lib/settings";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { siteName } = getSettings();
  return <AdminLayoutClient siteName={siteName}>{children}</AdminLayoutClient>;
}
