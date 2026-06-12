"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TagManager({ tags }: { tags: { tag: string; count: number }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function rename(oldName: string) {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditing(null);
      return;
    }
    const res = await fetch(`/api/admin/tags/${encodeURIComponent(oldName)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur");
    }
  }

  async function remove(name: string) {
    if (!confirm(`Supprimer le tag « ${name} » ? Il sera retiré de tous les articles.`)) return;
    const res = await fetch(`/api/admin/tags/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setError("Erreur lors de la suppression");
  }

  return (
    <div className="nb-card divide-y-2 divide-ink/10">
      {error && (
        <p className="bg-[var(--peach)] p-3 text-sm font-semibold">{error}</p>
      )}
      {tags.map(({ tag, count }) => (
        <div key={tag} className="flex items-center gap-3 p-3">
          {editing === tag ? (
            <>
              <input
                className="field max-w-xs"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rename(tag)}
                autoFocus
              />
              <button onClick={() => rename(tag)} className="nb-btn nb-btn-primary text-xs">
                OK
              </button>
              <button onClick={() => setEditing(null)} className="nb-btn text-xs">
                Annuler
              </button>
            </>
          ) : (
            <>
              <span className="nb-pill bg-[var(--sky)]">{tag}</span>
              <span className="text-xs text-ink/60">
                {count} article{count > 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => {
                    setEditing(tag);
                    setNewName(tag);
                    setError(null);
                  }}
                  className="text-sm font-semibold underline"
                >
                  Renommer
                </button>
                <button
                  onClick={() => remove(tag)}
                  className="text-sm font-semibold text-[#b03030] underline"
                >
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      {tags.length === 0 && <p className="p-6 text-sm">Aucun tag.</p>}
    </div>
  );
}
