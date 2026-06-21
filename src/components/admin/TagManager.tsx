"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pageWindow } from "@/components/Pagination";

type SortKey = "alpha" | "count";
const PER = 20;

export function TagManager({ tags }: { tags: { tag: string; count: number }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("count");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      tags
        .filter((t) => t.tag.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (sort === "alpha" ? a.tag.localeCompare(b.tag) : b.count - a.count)),
    [tags, search, sort]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * PER, cur * PER);

  async function rename(oldName: string) {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditing(null);
      return;
    }
    setBusy(oldName);
    const res = await fetch(`/api/admin/tags/${encodeURIComponent(oldName)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setBusy(null);
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
    setBusy(name);
    const res = await fetch(`/api/admin/tags/${encodeURIComponent(name)}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
    else setError("Erreur lors de la suppression");
  }

  function onSearch(v: string) {
    setSearch(v);
    setPage(1);
  }
  function onSort(k: SortKey) {
    setSort(k);
    setPage(1);
  }

  if (tags.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "var(--s9) var(--s5)", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
        Aucun tag
      </div>
    );
  }

  const mono = { fontFamily: "var(--ff-m)", fontSize: 12 } as const;

  return (
    <div>
      {error && (
        <div style={{ marginBottom: "var(--s4)", padding: "var(--s3) var(--s4)", background: "color-mix(in srgb, var(--er) 12%, transparent)", border: "1px solid var(--er)", ...mono, color: "var(--er)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--s3)", marginBottom: "var(--s5)", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="inp inp-sm"
          placeholder="Rechercher un tag…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <div style={{ display: "flex", gap: "var(--s2)", marginLeft: "auto" }}>
          {(["count", "alpha"] as SortKey[]).map((k) => (
            <button key={k} className={`btn btn-sm ${sort === k ? "btn-p" : "btn-g"}`} onClick={() => onSort(k)} style={{ ...mono, fontSize: 11 }}>
              {k === "count" ? "Popularité" : "A → Z"}
            </button>
          ))}
        </div>
        <span style={{ ...mono, fontSize: 11, color: "var(--ink-f)" }}>
          {filtered.length} tag{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ border: "1px solid var(--ln)", background: "var(--bg-r)" }}>
        {slice.map(({ tag, count }, i) => (
          <div
            key={tag}
            style={{ display: "flex", alignItems: "center", gap: "var(--s4)", padding: "var(--s3) var(--s4)", borderBottom: i < slice.length - 1 ? "1px solid var(--ln)" : "none" }}
          >
            {editing === tag ? (
              <>
                <input
                  className="inp inp-sm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && rename(tag)}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button onClick={() => rename(tag)} className="btn btn-sm btn-p" disabled={busy === tag} style={{ ...mono, fontSize: 10 }}>OK</button>
                <button onClick={() => setEditing(null)} className="btn btn-sm" style={{ ...mono, fontSize: 10 }}>Annuler</button>
              </>
            ) : (
              <>
                <span className="tag" style={{ fontSize: 11, padding: "3px 8px", flexShrink: 0 }}>{tag}</span>
                <span style={{ ...mono, fontSize: 11, color: "var(--ink-f)", width: 70, flexShrink: 0 }}>{count} art.</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "var(--s2)" }}>
                  <button
                    onClick={() => { setEditing(tag); setNewName(tag); setError(null); }}
                    className="btn btn-sm btn-g"
                    style={{ ...mono, fontSize: 10 }}
                  >
                    Renommer
                  </button>
                  <button
                    onClick={() => remove(tag)}
                    className="btn btn-sm"
                    disabled={busy === tag}
                    style={{ ...mono, fontSize: 10, color: "var(--er)", borderColor: "var(--er)" }}
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "var(--s2)", marginTop: "var(--s5)" }}>
          {cur > 1 && <button className="btn btn-sm" onClick={() => setPage(cur - 1)} style={{ ...mono, fontSize: 11 }}>←</button>}
          {pageWindow(cur, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} style={{ ...mono, fontSize: 11, color: "var(--ink-f)", minWidth: 20, textAlign: "center" }}>…</span>
            ) : (
              <button key={p} className={`btn btn-sm${p === cur ? " btn-p" : ""}`} onClick={() => setPage(p)} style={{ ...mono, fontSize: 11 }}>{p}</button>
            )
          )}
          {cur < totalPages && <button className="btn btn-sm" onClick={() => setPage(cur + 1)} style={{ ...mono, fontSize: 11 }}>→</button>}
        </div>
      )}
    </div>
  );
}
