"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setMessage(res.ok ? "Réglages enregistrés." : "Erreur lors de l'enregistrement.");
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="nb-card p-6">
        <h2 className="font-display text-xl font-bold">Identité du site</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nom du site
            <input
              className="field"
              value={settings.siteName}
              onChange={(e) => set("siteName", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Tagline
            <input
              className="field"
              value={settings.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Description SEO
            <textarea
              className="field min-h-20"
              value={settings.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="nb-card p-6">
        <h2 className="font-display text-xl font-bold">Pipeline</h2>
        <p className="mt-1 text-sm text-ink/60">
          Une news notée au-dessus du seuil breaking est publiée immédiatement avec le badge « À
          chaud ». En dessous du seuil file d&apos;attente, elle est ignorée.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Seuil breaking (0-10)
            <input
              type="number"
              min={0}
              max={10}
              className="field"
              value={settings.breakingThreshold}
              onChange={(e) => set("breakingThreshold", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Seuil file d&apos;attente (0-10)
            <input
              type="number"
              min={0}
              max={10}
              className="field"
              value={settings.queueThreshold}
              onChange={(e) => set("queueThreshold", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Articles max par passage
            <input
              type="number"
              min={0}
              className="field"
              value={settings.maxArticlesPerRun}
              onChange={(e) => set("maxArticlesPerRun", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Articles max par jour
            <input
              type="number"
              min={0}
              className="field"
              value={settings.maxArticlesPerDay}
              onChange={(e) => set("maxArticlesPerDay", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Durée du badge « À chaud » (heures)
            <input
              type="number"
              min={1}
              className="field"
              value={settings.breakingDurationHours}
              onChange={(e) => set("breakingDurationHours", Number(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="nb-card p-6">
        <h2 className="font-display text-xl font-bold">Réseaux sociaux (footer)</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            X / Twitter
            <input
              className="field"
              placeholder="https://x.com/..."
              value={settings.socialX}
              onChange={(e) => set("socialX", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            LinkedIn
            <input
              className="field"
              placeholder="https://linkedin.com/in/..."
              value={settings.socialLinkedin}
              onChange={(e) => set("socialLinkedin", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            GitHub
            <input
              className="field"
              placeholder="https://github.com/..."
              value={settings.socialGithub}
              onChange={(e) => set("socialGithub", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="nb-card p-6">
        <h2 className="font-display text-xl font-bold">Avancé</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => set("maintenanceMode", e.target.checked)}
            />
            Mode maintenance (le site public affiche une page d&apos;attente)
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={settings.adsEnabled}
              onChange={(e) => set("adsEnabled", e.target.checked)}
            />
            Activer la publicité (les emplacements existent déjà, désactivés par défaut)
          </label>
          {settings.adsEnabled && (
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Code publicitaire (AdSense ou autre)
              <textarea
                className="field min-h-24 font-mono text-xs"
                value={settings.adsCode}
                onChange={(e) => set("adsCode", e.target.value)}
              />
            </label>
          )}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="nb-btn nb-btn-primary">
          {saving ? "Enregistrement…" : "Enregistrer les réglages"}
        </button>
        {message && <p className="text-sm font-semibold">{message}</p>}
      </div>
    </div>
  );
}
