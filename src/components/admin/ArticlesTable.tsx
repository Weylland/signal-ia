"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArticleMeta } from "@/lib/articles";

type Props = {
  articles: ArticleMeta[];
};

export function ArticlesTable({ articles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allSlugs = articles.map((a) => a.slug);
  const allChecked = allSlugs.length > 0 && allSlugs.every((s) => selected.has(s));
  const someChecked = selected.size > 0;

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allSlugs));
    }
  }

  function toggleOne(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function runBulk(action: "publish" | "unpublish" | "delete") {
    setBulkError(null);
    const slugs = [...selected];
    const res = await fetch("/api/admin/articles/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, slugs }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBulkError(data.error ?? "Erreur");
      return;
    }
    setSelected(new Set());
    setConfirmDelete(false);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      {/* Bulk action bar */}
      {someChecked && (
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--bg-r)", border: "1px solid var(--ac)",
          padding: "var(--s3) var(--s5)",
          display: "flex", alignItems: "center", gap: "var(--s4)",
          marginBottom: "var(--s4)", boxShadow: "0 2px 8px rgba(0,0,0,.08)"
        }}>
          <span style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink)", flex: 1 }}>
            {selected.size} article{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => runBulk("publish")}
            disabled={isPending}
            className="btn btn-sm btn-p"
            style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
          >
            Publier
          </button>
          <button
            onClick={() => runBulk("unpublish")}
            disabled={isPending}
            className="btn btn-sm btn-g"
            style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
          >
            Dépublier
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={isPending}
            className="btn btn-sm"
            style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--er)", borderColor: "var(--er)" }}
          >
            Supprimer
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="btn btn-sm btn-g"
            style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}
          >
            × Annuler
          </button>
        </div>
      )}

      {bulkError && (
        <div style={{ marginBottom: "var(--s4)", padding: "var(--s3) var(--s4)", border: "1px solid var(--er)", color: "var(--er)", fontFamily: "var(--ff-m)", fontSize: 12 }}>
          {bulkError}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s7)", maxWidth: 400, width: "90%", boxShadow: "var(--sh)" }}>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 700, marginBottom: "var(--s3)" }}>Supprimer {selected.size} article{selected.size > 1 ? "s" : ""} ?</div>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginBottom: "var(--s6)" }}>
              Cette action est irréversible.
            </div>
            <div style={{ display: "flex", gap: "var(--s3)" }}>
              <button
                className="btn btn-p"
                style={{ flex: 1, fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--er)", background: "none", borderColor: "var(--er)" }}
                onClick={() => runBulk("delete")}
                disabled={isPending}
              >
                {isPending ? "Suppression…" : "Supprimer"}
              </button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--ln-h)" }}>
              <th style={{ padding: "var(--s2) var(--s3)", width: 36 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  style={{ cursor: "pointer", accentColor: "var(--ac)" }}
                />
              </th>
              {["Titre", "Type", "Statut", "Date", "Vues", "Actions"].map((h) => (
                <th key={h} style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", padding: "var(--s2) var(--s3)", textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => {
              const isSelected = selected.has(a.slug);
              return (
                <tr
                  key={a.slug}
                  style={{ borderBottom: "1px solid var(--ln)", background: isSelected ? "color-mix(in srgb, var(--ac) 5%, transparent)" : undefined, cursor: "pointer" }}
                  onClick={() => toggleOne(a.slug)}
                >
                  <td style={{ padding: "var(--s3)", width: 36 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(a.slug)}
                      style={{ cursor: "pointer", accentColor: "var(--ac)" }}
                    />
                  </td>
                  <td style={{ padding: "var(--s3)", maxWidth: 300 }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ fontFamily: "var(--ff-h)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Link href={`/admin/articles/${a.slug}`} style={{ color: "var(--ac)", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>{a.title}</Link>
                    </div>
                    <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)", marginTop: 2 }}>
                      {a.tags.slice(0, 2).join(" · ")}
                    </div>
                  </td>
                  <td style={{ padding: "var(--s3)" }}>
                    <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, padding: "2px 6px", border: "1px solid var(--ln-h)", color: "var(--ink-f)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {a.type}
                    </span>
                  </td>
                  <td style={{ padding: "var(--s3)" }}>
                    <StatusBadge published={a.published} scheduled={!!a.scheduledAt} />
                  </td>
                  <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", whiteSpace: "nowrap" }}>
                    {a.date.slice(0, 10)}
                  </td>
                  <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-d)" }}>
                    {a.views.toLocaleString("fr-FR")}
                  </td>
                  <td style={{ padding: "var(--s3)" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: "var(--s2)" }}>
                      <Link href={`/admin/articles/${a.slug}`} className="btn btn-sm btn-g" style={{ fontFamily: "var(--ff-m)", fontSize: 10 }}>Éditer</Link>
                      {a.published && (
                        <Link href={`/articles/${a.slug}`} target="_blank" className="btn btn-sm btn-g" style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}>Voir ↗</Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {articles.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "var(--s9)", textAlign: "center", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
                  Aucun article trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ published, scheduled }: { published: boolean; scheduled: boolean }) {
  const cfg = published
    ? { l: "Publié", c: "var(--ok)" }
    : scheduled
      ? { l: "Planifié", c: "var(--wn)" }
      : { l: "Brouillon", c: "var(--ink-f)" };
  return (
    <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", padding: "2px 6px", border: "1px solid currentColor", color: cfg.c, whiteSpace: "nowrap" }}>
      {cfg.l}
    </span>
  );
}
