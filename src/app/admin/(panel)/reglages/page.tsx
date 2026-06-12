import { getSettings } from "@/lib/settings";
import { getSources } from "@/lib/sources";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { SourceManager } from "@/components/admin/SourceManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = getSettings();
  const sources = getSources();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Réglages</h1>
      <div className="mt-6 flex flex-col gap-8">
        <SourceManager sources={sources} />
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
