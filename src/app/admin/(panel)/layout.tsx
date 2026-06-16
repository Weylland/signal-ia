import { AdminLayoutClient } from "@/components/admin/AdminSidebar";
import { getSettings } from "@/lib/settings";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { siteName } = getSettings();
  return <AdminLayoutClient siteName={siteName}>{children}</AdminLayoutClient>;
}
