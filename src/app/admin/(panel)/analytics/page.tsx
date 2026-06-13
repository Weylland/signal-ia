import { getDb } from "@/lib/db";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

type ArticleViewRow = { slug: string; title: string; views: number; date: string; type: string };
type SourceStatRow = { source_name: string; count: number; avg_score: number };
type DayStatRow = { day: string; articles: number; total_views: number };
type ReactionRow = { slug: string; title: string; reaction: string; count: number };

export default function AnalyticsPage() {
  const db = getDb();

  const topArticles = db
    .prepare(`SELECT slug, title, views, date, type FROM articles WHERE published = 1 AND views > 0
              ORDER BY views DESC LIMIT 20`)
    .all() as ArticleViewRow[];

  const totalViews = (db.prepare("SELECT SUM(views) AS v FROM articles WHERE published = 1").get() as { v: number | null }).v ?? 0;
  const totalPublished = (db.prepare("SELECT COUNT(*) AS c FROM articles WHERE published = 1").get() as { c: number }).c;
  const totalSubscribers = (db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get() as { c: number }).c;

  const sourceStats = db
    .prepare(`SELECT source_name, COUNT(*) AS count, AVG(score) AS avg_score
              FROM pending_news WHERE status = 'published'
              GROUP BY source_name ORDER BY count DESC LIMIT 15`)
    .all() as SourceStatRow[];

  const dailyStats = db
    .prepare(`SELECT substr(date, 1, 10) AS day, COUNT(*) AS articles, SUM(views) AS total_views
              FROM articles WHERE published = 1 AND date >= datetime('now', '-30 days')
              GROUP BY day ORDER BY day DESC LIMIT 30`)
    .all() as DayStatRow[];

  const topReactions = db
    .prepare(`SELECT a.slug, a.title, ar.reaction, ar.count
              FROM article_reactions ar JOIN articles a ON a.id = ar.article_id
              ORDER BY ar.count DESC LIMIT 15`)
    .all() as ReactionRow[];

  const reactionMap: Record<string, { useful: number; fire: number; think: number }> = {};
  for (const r of topReactions) {
    if (!reactionMap[r.slug]) reactionMap[r.slug] = { useful: 0, fire: 0, think: 0 };
    (reactionMap[r.slug] as Record<string, number>)[r.reaction] = r.count;
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-bold">Analytics</h1>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Vues totales", value: totalViews.toLocaleString("fr-FR") },
          { label: "Articles publiés", value: totalPublished },
          { label: "Abonnés newsletter", value: totalSubscribers },
        ].map(({ label, value }) => (
          <div key={label} className="nb-card p-5">
            <p className="meta uppercase">{label}</p>
            <p className="font-display mt-2 text-4xl">{value}</p>
          </div>
        ))}
      </div>

      {/* Top articles */}
      <FadeUp>
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">Top articles par vues</h2>
          <div className="flex flex-col gap-1">
            {topArticles.length === 0 && <p className="text-sm text-[var(--ink-dim)]">Pas encore de données.</p>}
            {topArticles.map((a, i) => (
              <div key={a.slug} className="flex items-center gap-4 border-b border-line py-2.5 text-sm">
                <span className="font-display w-7 shrink-0 text-lg text-[var(--ink-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <a href={`/articles/${a.slug}`} target="_blank" className="hover:text-[var(--accent)] truncate block">
                    {a.title}
                  </a>
                  <span className="meta text-xs uppercase">{a.date.slice(0, 10)} · {a.type}</span>
                </div>
                <span className="meta shrink-0 uppercase">{a.views} vues</span>
              </div>
            ))}
          </div>
        </section>
      </FadeUp>

      {/* Reactions */}
      {topReactions.length > 0 && (
        <FadeUp>
          <section>
            <h2 className="mb-4 font-display text-xl font-bold">Réactions</h2>
            <div className="flex flex-col gap-1">
              {Object.entries(reactionMap).slice(0, 10).map(([slug, counts]) => {
                const title = topReactions.find((r) => r.slug === slug)?.title ?? slug;
                return (
                  <div key={slug} className="flex items-center gap-4 border-b border-line py-2 text-sm">
                    <a href={`/articles/${slug}`} target="_blank" className="min-w-0 flex-1 truncate hover:text-[var(--accent)]">
                      {title}
                    </a>
                    <span className="meta shrink-0 uppercase">
                      👍 {counts.useful} · 🔥 {counts.fire} · 🤔 {counts.think}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </FadeUp>
      )}

      {/* Sources */}
      {sourceStats.length > 0 && (
        <FadeUp>
          <section>
            <h2 className="mb-4 font-display text-xl font-bold">Sources (articles générés)</h2>
            <div className="flex flex-col gap-1">
              {sourceStats.map((s) => (
                <div key={s.source_name} className="flex items-center gap-4 border-b border-line py-2 text-sm">
                  <span className="flex-1">{s.source_name}</span>
                  <span className="meta uppercase">{s.count} articles · score moyen {(s.avg_score ?? 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </section>
        </FadeUp>
      )}

      {/* 30-day activity */}
      <FadeUp>
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">Activité 30 jours</h2>
          <div className="flex flex-col gap-1">
            {dailyStats.map((d) => (
              <div key={d.day} className="flex items-center gap-4 border-b border-line py-1.5 text-sm">
                <span className="meta w-28 shrink-0 uppercase">{d.day}</span>
                <div className="flex-1">
                  <div
                    className="h-2 bg-[var(--accent)]"
                    style={{ width: `${Math.min(100, (d.articles / 8) * 100)}%`, minWidth: d.articles > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="meta shrink-0 uppercase">{d.articles} art. · {d.total_views ?? 0} vues</span>
              </div>
            ))}
          </div>
        </section>
      </FadeUp>
    </div>
  );
}
