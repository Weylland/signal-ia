"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = { title: string; excerpt: string; image: string | null; sourceUrl: string };

export function ImportUrlButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json() as ImportResult & { error?: string };
    if (!res.ok || data.error) {
      setError(data.error ?? "Erreur");
      setLoading(false);
      return;
    }
    // Pass data via query params to new article page (pre-fill via URL)
    const params = new URLSearchParams({
      title: data.title,
      excerpt: data.excerpt,
      image: data.image ?? "",
      source: data.sourceUrl,
    });
    router.push(`/admin/articles/new?${params.toString()}`);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="nb-btn text-sm">
        ⬇ Importer depuis URL
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="url"
        className="field w-72 text-sm"
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleImport()}
        autoFocus
      />
      <button type="button" onClick={handleImport} disabled={loading} className="nb-btn nb-btn-primary text-sm">
        {loading ? "…" : "Importer"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="nb-btn text-sm">✕</button>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
