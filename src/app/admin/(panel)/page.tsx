import Link from "next/link";
import { getAllArticles, getStats } from "@/lib/articles";
import { getDb } from "@/lib/db";
import { getSources } from "@/lib/sources";
import { PipelineTrigger } from "@/components/admin/PipelineTrigger";

export const dynamic = "force-dynamic";

function nextCronMinutes(): number {
  const intervalMin = parseInt(process.env.PIPELINE_INTERVAL_MIN ?? "30", 10);
  const now = new Date();
  const current = now.getMinutes();
  const nextMark = Math.ceil((current + 1) / intervalMin) * intervalMin;
  const diff = nextMark - current;
  return diff <= 0 ? intervalMin : diff;
}

type RunRow = { started_at: string; status: string; items_new: number; articles_created: number };

export default async function AdminDashboard() {
  const [stats, articles] = await Promise.all([getStats(), getAllArticles({ includeDrafts: true })]);
  const recent = articles.slice(0, 5);
  const db = getDb();

  const lastRun = db
    .prepare("SELECT started_at, status, items_new, articles_created FROM pipeline_runs ORDER BY id DESC LIMIT 1")
    .get() as RunRow | undefined;
  const queueCount = (db.prepare("SELECT COUNT(*) AS c FROM pending_news WHERE status = 'queued'").get() as { c: number }).c;
  const subscriberCount = (db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get() as { c: number }).c;
  const sources = getSources().slice(0, 6);
  const nextIn = nextCronMinutes();

  const metrics = [
    { label: "Articles publiés", value: stats.published, delta: null },
    { label: "Brouillons", value: stats.drafts, delta: null },
    { label: "Abonnés newsletter", value: subscriberCount, delta: null },
    { label: "File d'attente", value: queueCount, accent: queueCount > 0 ? "var(--wn)" : undefined },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--s5)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Dashboard</h1>
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
            signal·ia — prochain pipeline dans {nextIn} min
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center" }}>
          <PipelineTrigger />
          <Link href="/admin/articles/new" className="btn btn-p">+ Nouvel article</Link>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s5)", boxShadow: "2px 2px 0 var(--ln-h)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}
          >
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--ink-f)" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 34, fontWeight: 700, letterSpacing: "-.02em", color: m.accent ?? "var(--ink)", lineHeight: 1 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s6)", alignItems: "start" }}>
        {/* Articles récents */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s5)" }}>
            <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 16, fontWeight: 600 }}>Articles récents</h2>
            <Link href="/admin/articles" className="btn btn-g btn-sm" style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>
              Voir tout →
            </Link>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--ln-h)" }}>
                {["Titre", "Statut", "Date", "Vues"].map((h) => (
                  <th key={h} style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", padding: "var(--s2) var(--s3)", textAlign: "left", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => (
                <tr key={a.slug} style={{ borderBottom: "1px solid var(--ln)" }}>
                  <td style={{ padding: "var(--s3)", maxWidth: 280 }}>
                    <Link href={`/admin/articles/${a.slug}`} style={{ fontFamily: "var(--ff-h)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", color: "var(--ac)", textDecoration: "none" }}>
                      {a.title}
                    </Link>
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
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "var(--s6)", textAlign: "center", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
                    Aucun article
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pipeline health */}
        <div>
          <div style={{ fontFamily: "var(--ff-h)", fontSize: 16, fontWeight: 600, marginBottom: "var(--s5)" }}>Santé du pipeline</div>
          {lastRun && (
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", marginBottom: "var(--s4)", padding: "var(--s3) var(--s4)", background: "var(--bg-r)", border: "1px solid var(--ln)" }}>
              Dernier : {new Date(lastRun.started_at).toLocaleString("fr-FR")} · {lastRun.items_new} items · {lastRun.articles_created} créé(s)
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            {sources.map((s) => {
              const health = "ok";
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "var(--s3)", padding: "var(--s3) var(--s4)", background: "var(--bg-r)", border: "1px solid var(--ln)" }}>
                  <span className="s-ok" style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--ff-h)", fontSize: 13, flex: 1 }}>{s.name}</span>
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ok)", textTransform: "uppercase", letterSpacing: ".06em" }}>{health}</span>
                </div>
              );
            })}
          </div>
          <Link href="/admin/sources" className="btn btn-sm btn-g" style={{ marginTop: "var(--s4)", width: "100%", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", textAlign: "center", display: "block" }}>
            Gérer les sources →
          </Link>
        </div>
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
