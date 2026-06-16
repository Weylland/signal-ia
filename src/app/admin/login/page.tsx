import { getSettings } from "@/lib/settings";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  const { siteName } = getSettings();
  return <LoginForm siteName={siteName} />;
}
