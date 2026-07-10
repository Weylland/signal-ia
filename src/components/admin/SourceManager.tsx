"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Source } from "@/lib/sources";

export function SourceManager({ sources }: { sources: Source[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null);

  async function test(key: string, feedUrl: string, id?: number) {
    if (!feedUrl.trim()) return;
    setTesting(key);
    setTestMsg(null);
    try {
      const res = await fetch("/api/admin/sources/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feedUrl, id }),
      });
      const data = await res.json();
      setTestMsg(
        data.ok
          ? { key, ok: true, text: `Flux OK — ${data.count} article${data.count > 1 ? "s" : ""}` }
          : { key, ok: false, text: data.error ?? "Flux illisible" }
      );
    } catch {
      setTestMsg({ key, ok: false, text: "Test impossible" });
    }
    setTesting(null);
    if (id !== undefined) router.refresh();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Erreur");
      return;
    }
    setName("");
    setUrl("");
    router.refresh();
  }

  async function toggle(source: Source) {
    await fetch(`/api/admin/sources/${source.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !source.active }),
    });
    router.refresh();
  }

  async function remove(source: Source) {
    if (!confirm(`Supprimer la source « ${source.name} » ?`)) return;
    await fetch(`/api/admin/sources/${source.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="nb-card p-6">
      <h2 className="font-display text-xl font-bold">Sources RSS</h2>
      <p className="mt-1 text-sm text-ink/60">
        Les flux actifs sont relevés à chaque passage du pipeline.
      </p>

      <div className="mt-4 flex flex-col divide-y-2 divide-ink border-2 border-ink">
        {sources.map((source) => (
          <div key={source.id} className="flex flex-wrap items-center gap-3 p-3">
            <span
              className="nb-pill shrink-0"
              style={{
                background:
                  source.lastStatus === "error"
                    ? "var(--peach)"
                    : source.active
                      ? "var(--mint)"
                      : "var(--cream-2)",
              }}
              title={source.lastError ?? undefined}
            >
              {source.lastStatus === "error" ? "Erreur" : source.active ? "Actif" : "Inactif"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{source.name}</p>
              <p className="truncate text-xs text-ink/50">{source.url}</p>
              {source.lastFetchAt && (
                <p className="text-xs text-ink/50">
                  Dernier relevé : {new Date(source.lastFetchAt).toLocaleString("fr-FR")}
                  {source.lastError ? ` — ${source.lastError}` : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => test(String(source.id), source.url, source.id)}
              disabled={testing === String(source.id)}
              className="nb-btn text-xs"
            >
              {testing === String(source.id) ? "Test…" : "Tester"}
            </button>
            <button onClick={() => toggle(source)} className="nb-btn text-xs">
              {source.active ? "Désactiver" : "Activer"}
            </button>
            <button onClick={() => remove(source)} className="nb-btn text-xs">
              Supprimer
            </button>
            {testMsg && testMsg.key === String(source.id) && (
              <p className="w-full text-xs font-semibold" style={{ color: testMsg.ok ? "var(--ok)" : "var(--er)" }}>
                {testMsg.text}
              </p>
            )}
          </div>
        ))}
        {sources.length === 0 && <p className="p-4 text-sm">Aucune source.</p>}
      </div>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Nom
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="flex min-w-64 flex-1 flex-col gap-1 text-sm font-semibold">
          URL du flux RSS
          <input
            className="field"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </label>
        <button
          type="button"
          onClick={() => test("new", url)}
          disabled={testing === "new" || !url.trim()}
          className="nb-btn text-xs"
        >
          {testing === "new" ? "Test…" : "Tester"}
        </button>
        <button type="submit" className="nb-btn nb-btn-primary">
          + Ajouter
        </button>
        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        {testMsg && testMsg.key === "new" && (
          <p className="w-full text-sm font-semibold" style={{ color: testMsg.ok ? "var(--ok)" : "var(--er)" }}>
            {testMsg.text}
          </p>
        )}
      </form>
    </section>
  );
}
