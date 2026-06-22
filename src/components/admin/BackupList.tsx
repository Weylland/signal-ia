"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Backup = { file: string; mtime: number; size: number };

export function BackupList({ backups }: { backups: Backup[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doDelete(file: string) {
    setDeleting(file);
    setConfirm(null);
    const res = await fetch(`/api/admin/backup/${encodeURIComponent(file)}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
    }
  }

  if (backups.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "var(--s7)", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
        Aucune sauvegarde
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{ marginBottom: "var(--s4)", padding: "var(--s3) var(--s4)", border: "1px solid var(--er)", color: "var(--er)", fontFamily: "var(--ff-m)", fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Popup de confirmation */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s7)", maxWidth: 420, width: "90%", boxShadow: "var(--sh)" }}>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 700, marginBottom: "var(--s3)" }}>Supprimer cette sauvegarde ?</div>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginBottom: "var(--s6)", wordBreak: "break-all" }}>{confirm}</div>
            <div style={{ display: "flex", gap: "var(--s3)" }}>
              <button
                className="btn btn-p"
                style={{ flex: 1, fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--er)", background: "none", borderColor: "var(--er)" }}
                onClick={() => doDelete(confirm)}
                disabled={deleting === confirm}
              >
                {deleting === confirm ? "Suppression…" : "Supprimer"}
              </button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--ln-h)" }}>
            {["Fichier", "Date", "Taille", ""].map((h) => (
              <th key={h} style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", padding: "var(--s2) var(--s3)", textAlign: "left", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {backups.map((b, i) => (
            <tr key={b.file} style={{ borderBottom: "1px solid var(--ln)", background: i === 0 ? "color-mix(in srgb, var(--ac) 4%, transparent)" : undefined }}>
              <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i === 0 && <span style={{ color: "var(--ok)", marginRight: 6 }}>●</span>}
                {b.file}
              </td>
              <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink)", whiteSpace: "nowrap" }}>
                {new Date(b.mtime).toLocaleString("fr-FR")}
              </td>
              <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", whiteSpace: "nowrap" }}>
                {(b.size / 1024 / 1024).toFixed(1)} Mo
              </td>
              <td style={{ padding: "var(--s3)", textAlign: "right" }}>
                <div style={{ display: "flex", gap: "var(--s2)", justifyContent: "flex-end" }}>
                  {i === 0 && (
                    // Téléchargement de fichier (route API), pas une navigation de page → <a> volontaire.
                    // eslint-disable-next-line @next/next/no-html-link-for-pages
                    <a href="/api/admin/backup" className="btn btn-sm btn-g" style={{ fontFamily: "var(--ff-m)", fontSize: 10 }}>
                      ↓ Télécharger
                    </a>
                  )}
                  <button
                    className="btn btn-sm"
                    style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--er)", borderColor: "var(--er)" }}
                    onClick={() => setConfirm(b.file)}
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
