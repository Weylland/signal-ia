import { AdminLayoutClient } from "@/components/admin/AdminSidebar";
import { getSettings } from "@/lib/settings";
import { getDb } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { siteName } = getSettings();
  const unreadMessages = (
    getDb().prepare('SELECT COUNT(*) AS c FROM contact_messages WHERE "read" = 0').get() as { c: number }
  ).c;
  return (
    <AdminLayoutClient siteName={siteName} unreadMessages={unreadMessages}>
      {children}
    </AdminLayoutClient>
  );
}
