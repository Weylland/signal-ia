import { getDb } from "./db";

export type SiteSettings = {
  siteName: string;
  tagline: string;
  seoDescription: string;
  breakingThreshold: number;
  queueThreshold: number;
  maxArticlesPerRun: number;
  maxArticlesPerDay: number;
  breakingDurationHours: number;
  socialX: string;
  socialLinkedin: string;
  socialGithub: string;
  maintenanceMode: boolean;
  adsEnabled: boolean;
  adsCode: string;
  requireApproval: boolean;
  blacklistKeywords: string;
  blacklistDomains: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "signal·ia",
  tagline: "L'actu IA et robotique, en français, sans le bruit.",
  seoDescription:
    "Veille IA en français : les news qui comptent sur l'intelligence artificielle, la robotique et le dev lié à l'IA, plus des tutos pratiques.",
  breakingThreshold: 8,
  queueThreshold: 5,
  maxArticlesPerRun: 3,
  maxArticlesPerDay: 8,
  breakingDurationHours: 6,
  socialX: "",
  socialLinkedin: "",
  socialGithub: "",
  maintenanceMode: false,
  adsEnabled: false,
  adsCode: "",
  requireApproval: false,
  blacklistKeywords: "",
  blacklistDomains: "",
};

export function getSettings(): SiteSettings {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const result = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(result) as (keyof SiteSettings)[]) {
    if (!(key in stored)) continue;
    const raw = stored[key];
    const def = DEFAULT_SETTINGS[key];
    if (typeof def === "number") {
      const n = Number(raw);
      if (Number.isFinite(n)) (result[key] as number) = n;
    } else if (typeof def === "boolean") {
      (result[key] as boolean) = raw === "true";
    } else {
      (result[key] as string) = raw;
    }
  }
  return result;
}

export function saveSettings(partial: Partial<SiteSettings>): void {
  const db = getDb();
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  const save = db.transaction(() => {
    for (const [key, value] of Object.entries(partial)) {
      if (!(key in DEFAULT_SETTINGS)) continue;
      upsert.run(key, String(value));
    }
  });
  save();
}
