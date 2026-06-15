import Link from "next/link";
import { latestBackup, backupCount, backupDir } from "@/lib/backup";
import { getDb } from "@/lib/db";
import { statSync, readdirSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export default function BackupPage() {
  const latestPath = latestBackup();
  const count = backupCount();
  const db = getDb();
  const dbSize = (() => { try { const r = db.prepare("SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size()").get() as { size: number }; return r.size; } catch { return 0; } })();

  const latest = latestPath
    ? (() => { try { const st = statSync(latestPath); return { name: path.basename(latestPath), size: st.size, mtime: st.mtimeMs }; } catch { return null; } })()
    : null;

  const metrics = [
    { label: "Dernière sauvegarde", value: latest ? new Date(latest.mtime).toLocaleString("fr-FR") : "Aucune" },
    { label: "Taille base (live)", value: dbSize > 0 ? (dbSize / 1024 / 1024).toFixed(1) + " Mo" : "N/A" },
    { label: "Snapshots disponibles", value: count },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--s5)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Sauvegarde</h1>
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
            Backups automatiques quotidiens · Conservation 14 snapshots
          </p>
        </div>
        <form action="/api/admin/backup" method="post">
          <button type="submit" className="btn btn-p">+ Sauvegarde manuelle</button>
        </form>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s5)", boxShadow: "2px 2px 0 var(--ln-h)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--ink-f)" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: count === m.value && typeof m.value === 'number' && m.value === 0 ? 24 : 22, fontWeight: 700, letterSpacing: "-.02em", color: "var(--ink)", lineHeight: 1.2 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Latest backup download */}
      {latest && (
        <div style={{ marginBottom: "var(--s7)", padding: "var(--s5)", background: "var(--bg-r)", border: "1px solid var(--ln)", display: "flex", alignItems: "center", gap: "var(--s5)", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 14, fontWeight: 600 }}>Dernier snapshot</div>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", marginTop: 4 }}>
              {latest.name} · {(latest.size / 1024 / 1024).toFixed(1)} Mo · {new Date(latest.mtime).toLocaleString("fr-FR")}
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center" }}>
            <span className="s-ok" />
            <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ok)", textTransform: "uppercase", letterSpacing: ".06em" }}>OK</span>
            <a href="/api/admin/backup" className="btn btn-sm btn-g" style={{ fontFamily: "var(--ff-m)", fontSize: 10 }}>
              Télécharger ↓
            </a>
          </div>
        </div>
      )}

      {count === 0 && (
        <div style={{ textAlign: "center", padding: "var(--s9) var(--s5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s4)" }}>
          <span style={{ fontFamily: "var(--ff-m)", fontSize: 40, color: "var(--ln-h)" }}>⊞</span>
          <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 600, color: "var(--ink-d)" }}>Aucune sauvegarde</div>
          <div style={{ fontFamily: "var(--ff-b)", fontSize: 14, color: "var(--ink-f)" }}>
            La première sauvegarde automatique sera effectuée à 03h00. Vous pouvez aussi en créer une manuellement.
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ padding: "var(--s5)", background: "var(--bg-r)", border: "1px solid var(--ln)", borderLeft: "3px solid var(--ac)" }}>
        <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", lineHeight: 1.6 }}>
          Les sauvegardes sont stockées dans le dossier <code style={{ fontFamily: "var(--ff-m)", background: "var(--bg-d)", padding: "1px 4px" }}>backups/</code> du volume Railway.
          Un cron tourne chaque nuit à 03h00. Maximum 14 snapshots conservés (rotation automatique).
          Le téléchargement renvoie le snapshot le plus récent en format SQLite natif.
        </div>
      </div>
    </div>
  );
}
