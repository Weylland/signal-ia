import { getDb } from "@/lib/db";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export const dynamic = "force-dynamic";

type PendingRow = {
  id: number;
  url: string;
  title: string;
  source_name: string;
  summary: string;
  published_at: string | null;
  score: number | null;
  status: string;
  article_slug: string | null;
  seen_at: string;
};

type RunRow = { id: number; started_at: string; finished_at: string | null; status: string; items_new: number; articles_created: number; log: string };

export default function PipelinePage() {
  const db = getDb();

  const pending = db
    .prepare(`SELECT * FROM pending_news WHERE status IN ('queue','new') ORDER BY score DESC, seen_at DESC LIMIT 100`)
    .all() as PendingRow[];

  const stats = db
    .prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='queue' THEN 1 ELSE 0 END) AS queued, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published, SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected FROM pending_news`)
    .get() as { total: number; queued: number; published: number; rejected: number };

  const runs = db
    .prepare("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 5")
    .all() as RunRow[];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--s5)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Pipeline</h1>
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
            File de modération des articles générés automatiquement
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center", flexWrap: "wrap", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>
          <span style={{ color: "var(--wn)" }}>{stats.queued ?? 0}</span> en attente ·{" "}
          <span style={{ color: "var(--ok)" }}>{stats.published ?? 0}</span> publiés ·{" "}
          <span style={{ color: "var(--er)" }}>{stats.rejected ?? 0}</span> rejetés
        </div>
      </div>

      {/* Last runs */}
      {runs.length > 0 && (
        <div style={{ marginBottom: "var(--s7)" }}>
          <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600, marginBottom: "var(--s4)" }}>Derniers passages</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            {runs.map((r) => {
              const ok = r.status === "ok" || r.status === "done";
              const running = r.status === "running";
              const color = ok ? "var(--ok)" : running ? "var(--wn)" : "var(--er)";
              return (
                <details key={r.id} style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s3) var(--s4)" }}>
                  <summary style={{ display: "flex", cursor: "pointer", alignItems: "center", gap: "var(--s3)", flexWrap: "wrap" }}>
                    <span className={ok ? "s-ok" : running ? "s-wn" : "s-err"} />
                    <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color, textTransform: "uppercase", letterSpacing: ".06em" }}>{r.status}</span>
                    <span style={{ fontFamily: "var(--ff-h)", fontSize: 13 }}>{new Date(r.started_at).toLocaleString("fr-FR")}</span>
                    <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>{r.items_new} items · {r.articles_created} créé(s)</span>
                  </summary>
                  <pre style={{ marginTop: "var(--s3)", overflowX: "auto", fontFamily: "var(--ff-m)", fontSize: 11, lineHeight: 1.5, color: "var(--ink-d)", whiteSpace: "pre-wrap" }}>{r.log || "(pas de log)"}</pre>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {/* Moderation queue */}
      <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600, marginBottom: "var(--s5)" }}>File d&apos;attente</h2>
      <ModerationQueue items={pending} />

      {pending.length === 0 && (
        <div style={{ textAlign: "center", padding: "var(--s9) var(--s5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s4)" }}>
          <span style={{ fontFamily: "var(--ff-m)", fontSize: 40, color: "var(--ln-h)" }}>⊂</span>
          <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 600, color: "var(--ink-d)" }}>File vide</div>
          <div style={{ fontFamily: "var(--ff-b)", fontSize: 14, color: "var(--ink-f)" }}>Aucun article en attente de modération.</div>
        </div>
      )}
    </div>
  );
}
