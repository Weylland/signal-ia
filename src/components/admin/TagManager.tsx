"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SortKey = "alpha" | "count";

export function TagManager({ tags }: { tags: { tag: string; count: number }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("count");

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

  const filtered = tags
    .filter((t) => t.tag.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "alpha" ? a.tag.localeCompare(b.tag) : b.count - a.count
    );

  if (tags.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "var(--s9) var(--s5)", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
        Aucun tag
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ marginBottom: "var(--s4)", padding: "var(--s3) var(--s4)", background: "color-mix(in srgb, var(--er) 12%, transparent)", border: "1px solid var(--er)", fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--er)" }}>
          {error}
        </div>
      )}

      {/* Search + sort bar */}
      <div style={{ display: "flex", gap: "var(--s3)", marginBottom: "var(--s5)", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="inp inp-sm"
          placeholder="Rechercher un tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <div style={{ display: "flex", gap: "var(--s2)", marginLeft: "auto" }}>
          {(["count", "alpha"] as SortKey[]).map((k) => (
            <button
              key={k}
              className={`btn btn-sm ${sort === k ? "btn-p" : "btn-g"}`}
              onClick={() => setSort(k)}
              style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
            >
              {k === "count" ? "Popularité" : "A → Z"}
            </button>
          ))}
        </div>
        {search && (
          <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "var(--s3)" }}>
        {filtered.map(({ tag, count }) => (
          <div
            key={tag}
            style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s4)", display: "flex", flexDirection: "column", gap: "var(--s3)", transition: "border-color var(--d)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ac)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ln)"; }}
          >
            {editing === tag ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                <input
                  className="inp inp-sm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && rename(tag)}
                  autoFocus
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", gap: "var(--s2)" }}>
                  <button onClick={() => rename(tag)} className="btn btn-sm btn-p" style={{ flex: 1 }}>OK</button>
                  <button onClick={() => setEditing(null)} className="btn btn-sm" style={{ flex: 1 }}>Annuler</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <span className="tag" style={{ fontSize: 11, padding: "3px 8px", flexShrink: 0 }}>{tag}</span>
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>{count} art.</span>
                </div>
                <div style={{ display: "flex", gap: "var(--s2)" }}>
                  <button
                    onClick={() => { setEditing(tag); setNewName(tag); setError(null); }}
                    className="btn btn-sm btn-g"
                    style={{ flex: 1, fontFamily: "var(--ff-m)", fontSize: 10 }}
                  >
                    Renommer
                  </button>
                  <button
                    onClick={() => remove(tag)}
                    className="btn btn-sm"
                    style={{ flex: 1, fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--er)", borderColor: "var(--er)" }}
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
