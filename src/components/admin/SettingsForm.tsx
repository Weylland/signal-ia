"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/settings";
import { Tooltip } from "./Tooltip";

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

  const llmTooltips: Record<string, string> = {
    llmArticles: "Modèle utilisé pour rédiger le corps des articles de news. Claude donne de meilleurs résultats mais coûte ~0,001 $/article. Mistral est gratuit.",
    llmTutos: "Modèle utilisé pour générer les tutos quand le stock est épuisé. Claude produit des tutos plus structurés.",
    llmTweets: "Modèle utilisé pour rédiger le texte des tweets automatiques. Impact faible sur la qualité — Mistral suffit.",
    llmTranslation: "Modèle utilisé pour la traduction FR → EN (articles, tutos, tldr). Claude est plus fiable sur les longs HTML.",
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="nb-card p-6">
        <h2 className="font-display text-xl font-bold">Identité du site</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            <span className="flex items-center">
              Nom du site
              <Tooltip text="Affiché dans l'en-tête, le footer et les meta tags. Utilisé aussi dans les cartes X. Le « · » entre les deux mots est stylistique." />
            </span>
            <input
              className="field"
              value={settings.siteName}
              onChange={(e) => set("siteName", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            <span className="flex items-center">
              Tagline
              <Tooltip text="Phrase courte affichée sous le nom du site en page d'accueil et dans certains metas." />
            </span>
            <input
              className="field"
              value={settings.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            <span className="flex items-center">
              Description SEO
              <Tooltip text="Texte affiché par Google sous le titre dans les résultats de recherche. 150-160 caractères idéalement." />
            </span>
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
            <span className="flex items-center">
              Seuil breaking (0-10)
              <Tooltip text="Score IA minimum pour publier immédiatement avec le badge « À chaud ». Au-dessus de ce seuil = publication instantanée. En dessous, l'article attend en file ou est ignoré." />
            </span>
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
            <span className="flex items-center">
              Seuil file d&apos;attente (0-10)
              <Tooltip text="Score IA minimum pour qu'une news soit mise en file d'attente. En dessous de ce seuil, elle est ignorée et jamais publiée. Doit être inférieur au seuil breaking." />
            </span>
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
            <span className="flex items-center">
              Articles max par passage
              <Tooltip text="Nombre max d'articles rédigés à chaque run du pipeline. Limite la consommation LLM par passage. Le pipeline tourne automatiquement toutes les heures." />
            </span>
            <input
              type="number"
              min={0}
              className="field"
              value={settings.maxArticlesPerRun}
              onChange={(e) => set("maxArticlesPerRun", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            <span className="flex items-center">
              Articles max par jour
              <Tooltip text="Plafond quotidien d'articles publiés toutes sources confondues. Le pipeline s'arrête dès que ce nombre est atteint, même s'il reste du contenu à traiter." />
            </span>
            <input
              type="number"
              min={0}
              className="field"
              value={settings.maxArticlesPerDay}
              onChange={(e) => set("maxArticlesPerDay", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            <span className="flex items-center">
              Durée du badge « À chaud » (heures)
              <Tooltip text="Temps pendant lequel le badge « À chaud » reste visible sur un article après sa publication. Passé ce délai, le badge disparaît automatiquement. N'affecte pas la publication elle-même." />
            </span>
            <input
              type="number"
              min={1}
              className="field"
              value={settings.breakingDurationHours}
              onChange={(e) => set("breakingDurationHours", Number(e.target.value))}
            />
          </label>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <span className="flex items-center text-sm font-semibold">
              Modèle LLM par tâche
              <Tooltip text="Scoring et groupage des news restent toujours sur Mistral (gratuit). Claude nécessite ANTHROPIC_API_KEY sur Railway et bascule automatiquement sur Mistral si les crédits s'épuisent." />
            </span>
            <span className="text-xs font-normal text-ink/50">
              Choisis Claude ou Mistral pour chaque tâche, indépendamment. Le scoring et le groupage
              restent toujours sur Mistral (classification gratuite). Claude nécessite ANTHROPIC_API_KEY
              sur Railway et bascule automatiquement sur Mistral si les crédits s&apos;épuisent.
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                ["llmArticles", "Rédaction articles (news)"],
                ["llmTutos", "Génération tutos"],
                ["llmTweets", "Texte des tweets X"],
                ["llmTranslation", "Traduction EN"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1 text-sm font-semibold">
                  <span className="flex items-center">
                    {label}
                    <Tooltip text={llmTooltips[key]} />
                  </span>
                  <select
                    className="field"
                    value={settings[key]}
                    onChange={(e) => set(key, e.target.value as "mistral" | "claude")}
                  >
                    <option value="mistral">Mistral (gratuit)</option>
                    <option value="claude">Claude Haiku (premium)</option>
                  </select>
                </label>
              ))}
            </div>
          </div>
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
              checked={settings.requireApproval}
              onChange={(e) => set("requireApproval", e.target.checked)}
            />
            <span className="flex items-center">
              Approbation manuelle — les articles scorés ≥ seuil passent en file de modération au lieu d&apos;être auto-publiés
              <Tooltip text="Activé : chaque article doit être approuvé manuellement dans la file de modération avant d'être visible sur le site. Utile en rodage ou si tu veux contrôler chaque publication." />
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            <span className="flex items-center">
              Blacklist mots-clés (un par ligne, insensible à la casse)
              <Tooltip text="Si un de ces mots apparaît dans le titre ou le corps d'une news, elle est ignorée par le pipeline. Pratique pour filtrer crypto, NFT, sujets hors périmètre." />
            </span>
            <textarea
              className="field min-h-20 font-mono text-xs"
              placeholder={"crypto\nnft\nblockchain"}
              value={settings.blacklistKeywords}
              onChange={(e) => set("blacklistKeywords", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            <span className="flex items-center">
              Blacklist domaines sources (un par ligne)
              <Tooltip text="Les flux RSS de ces domaines sont ignorés entièrement lors du scoring. Utile pour bloquer des sources répétitives, spammy ou hors sujet sans les supprimer de la liste." />
            </span>
            <textarea
              className="field min-h-16 font-mono text-xs"
              placeholder={"spamsite.com\nbadsource.net"}
              value={settings.blacklistDomains}
              onChange={(e) => set("blacklistDomains", e.target.value)}
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => set("maintenanceMode", e.target.checked)}
            />
            <span className="flex items-center">
              Mode maintenance (le site public affiche une page d&apos;attente)
              <Tooltip text="Le site public affiche une page « bientôt disponible ». L'admin reste accessible normalement. Le pipeline continue de tourner en arrière-plan." />
            </span>
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={settings.adsEnabled}
              onChange={(e) => set("adsEnabled", e.target.checked)}
            />
            <span className="flex items-center">
              Activer la publicité (les emplacements existent déjà, désactivés par défaut)
              <Tooltip text="Active les emplacements pub déjà intégrés dans le layout. Tu peux coller le code AdSense ou autre réseau dans le champ qui apparaît en dessous." />
            </span>
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
