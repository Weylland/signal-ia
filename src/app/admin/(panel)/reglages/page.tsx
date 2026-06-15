import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = getSettings();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Réglages</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>Identité, pipeline et configuration</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
