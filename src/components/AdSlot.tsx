import { getSettings } from "@/lib/settings";

export function AdSlot({ position }: { position: string }) {
  const settings = getSettings();
  if (!settings.adsEnabled || !settings.adsCode) return null;

  return (
    <div
      data-ad-position={position}
      className="mx-auto my-8 w-full max-w-3xl"
      dangerouslySetInnerHTML={{ __html: settings.adsCode }}
    />
  );
}
