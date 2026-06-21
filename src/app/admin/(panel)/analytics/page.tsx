import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type ArticleViewRow = { slug: string; title: string; views: number; date: string; type: string };
type DayStatRow = { day: string; articles: number; total_views: number };

export default function AnalyticsPage() {
  const db = getDb();

  const topArticles = db
    .prepare(`SELECT slug, title, views, date, type FROM articles WHERE published = 1 AND views > 0 ORDER BY views DESC LIMIT 10`)
    .all() as ArticleViewRow[];

  const totalViews = (db.prepare("SELECT SUM(views) AS v FROM articles WHERE published = 1").get() as { v: number | null }).v ?? 0;
  const totalPublished = (db.prepare("SELECT COUNT(*) AS c FROM articles WHERE published = 1").get() as { c: number }).c;
  const totalSubscribers = (db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get() as { c: number }).c;
  const avgViews = totalPublished > 0 ? Math.round(totalViews / totalPublished) : 0;

  const dailyStats = db
    .prepare(`SELECT substr(date, 1, 10) AS day, COUNT(*) AS articles, SUM(views) AS total_views FROM articles WHERE published = 1 AND date >= datetime('now', '-7 days') GROUP BY day ORDER BY day ASC`)
    .all() as DayStatRow[];

  const maxViews = Math.max(...dailyStats.map((d) => d.total_views ?? 0), 1);
  const maxArticles = Math.max(...topArticles.map((a) => a.views), 1);

  const reactionTotals = db
    .prepare("SELECT reaction, SUM(count) AS total FROM article_reactions GROUP BY reaction")
    .all() as { reaction: string; total: number }[];
  const reactByKey = Object.fromEntries(reactionTotals.map((r) => [r.reaction, r.total])) as Record<string, number>;
  const REACTIONS = [
    { key: "useful", emoji: "👍", label: "Utile" },
    { key: "fire", emoji: "🔥", label: "Important" },
    { key: "think", emoji: "🤔", label: "À creuser" },
  ];
  const topReacted = db
    .prepare(
      `SELECT a.slug, a.title, SUM(r.count) AS reactions
       FROM article_reactions r JOIN articles a ON a.id = r.article_id
       GROUP BY a.id ORDER BY reactions DESC LIMIT 8`
    )
    .all() as { slug: string; title: string; reactions: number }[];

  const metrics = [
    { label: "Vues totales", value: totalViews.toLocaleString("fr-FR"), delta: null },
    { label: "Articles publiés", value: totalPublished, delta: null },
    { label: "Abonnés newsletter", value: totalSubscribers, delta: null },
    { label: "Vues moyennes/article", value: avgViews.toLocaleString("fr-FR"), delta: null },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Analytics</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          Données agrégées côté serveur, sans traceurs tiers
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s5)", boxShadow: "2px 2px 0 var(--ln-h)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--ink-f)" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 34, fontWeight: 700, letterSpacing: "-.02em", color: "var(--ink)", lineHeight: 1 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {dailyStats.length > 0 && (
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)", marginBottom: "var(--s6)" }}>
          <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600, marginBottom: "var(--s5)" }}>Vues par jour (7 jours)</h2>
          <div style={{ display: "flex", gap: "var(--s3)", alignItems: "flex-end", height: 140 }}>
            {dailyStats.map((d) => {
              const pct = Math.round(((d.total_views ?? 0) / maxViews) * 120);
              return (
                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s2)" }}>
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}>
                    {((d.total_views ?? 0) / 1000).toFixed(1)}k
                  </span>
                  <div style={{ width: "100%", background: "var(--ac)", height: Math.max(pct, 2), opacity: 0.85 }} />
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>
                    {d.day.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Réactions */}
      <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)", marginBottom: "var(--s6)" }}>
        <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600, marginBottom: "var(--s5)" }}>Réactions des lecteurs</h2>
        <div style={{ display: "flex", gap: "var(--s4)", flexWrap: "wrap", marginBottom: "var(--s5)" }}>
          {REACTIONS.map((r) => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "var(--s3)", border: "1px solid var(--ln)", padding: "var(--s3) var(--s5)", background: "var(--bg-d)" }}>
              <span style={{ fontSize: 20 }}>{r.emoji}</span>
              <div>
                <div style={{ fontFamily: "var(--ff-h)", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{(reactByKey[r.key] ?? 0).toLocaleString("fr-FR")}</div>
                <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)" }}>{r.label}</div>
              </div>
            </div>
          ))}
        </div>
        {topReacted.length === 0 ? (
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>Pas encore de réactions.</p>
        ) : (
          <div>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", marginBottom: "var(--s3)" }}>Articles les plus appréciés</div>
            {topReacted.map((a, i) => (
              <div key={a.slug} style={{ display: "flex", alignItems: "center", gap: "var(--s4)", padding: "var(--s3) 0", borderBottom: "1px solid var(--ln)" }}>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 14, fontWeight: 700, color: "var(--ac)", width: 20, flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, fontFamily: "var(--ff-h)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-d)", flexShrink: 0 }}>{a.reactions.toLocaleString("fr-FR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top articles */}
      <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s5)" }}>
        <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600, marginBottom: "var(--s4)" }}>Top articles</h2>
        {topArticles.length === 0 ? (
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>Pas encore de données.</p>
        ) : topArticles.map((a, i) => (
          <div key={a.slug} style={{ display: "flex", alignItems: "center", gap: "var(--s4)", padding: "var(--s3) 0", borderBottom: "1px solid var(--ln)" }}>
            <span style={{ fontFamily: "var(--ff-m)", fontSize: 14, fontWeight: 700, color: "var(--ac)", width: 20, flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--ff-h)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
              <div style={{ height: 4, background: "var(--bg-d)", marginTop: 4, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (a.views / maxArticles * 100) + "%", background: "var(--ac)" }} />
              </div>
            </div>
            <span style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-d)", flexShrink: 0 }}>
              {a.views.toLocaleString("fr-FR")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
