import Link from "next/link";
import { getAllArticles, getStats, formatDate } from "@/lib/articles";
import { getDb } from "@/lib/db";
import { PipelineTrigger } from "@/components/admin/PipelineTrigger";

export const dynamic = "force-dynamic";

type RunRow = {
  started_at: string;
  status: string;
  items_new: number;
  articles_created: number;
};

export default async function AdminDashboard() {
  const [stats, articles] = await Promise.all([
    getStats(),
    getAllArticles({ includeDrafts: true }),
  ]);
  const recent = articles.slice(0, 5);

  const db = getDb();
  const lastRun = db
    .prepare("SELECT started_at, status, items_new, articles_created FROM pipeline_runs ORDER BY id DESC LIMIT 1")
    .get() as RunRow | undefined;
  const queueCount = (
    db.prepare("SELECT COUNT(*) AS c FROM pending_news WHERE status = 'queued'").get() as { c: number }
  ).c;
  const subscriberCount = (
    db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get() as { c: number }
  ).c;

  const cards = [
    { label: "Articles", value: stats.total, color: "var(--sunshine)" },
    { label: "Publiés", value: stats.published, color: "var(--mint)" },
    { label: "Brouillons", value: stats.drafts, color: "var(--peach)" },
    { label: "Tutos", value: stats.tutos, color: "var(--sky)" },
    { label: "Vues totales", value: stats.views, color: "var(--cream-2)" },
    { label: "Abonnés newsletter", value: subscriberCount, color: "var(--cream-2)" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Tableau de bord</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="nb-card p-5" style={{ background: card.color }}>
            <p className="font-display text-4xl font-bold">{card.value}</p>
            <p className="mt-1 text-sm font-semibold">{card.label}</p>
          </div>
        ))}
      </div>

      <Link href="/admin/pipeline" className="nb-card mt-6 flex flex-wrap items-center gap-3 p-4">
        <span
          className="nb-pill"
          style={{
            background: !lastRun
              ? "var(--cream-2)"
              : lastRun.status === "error"
                ? "var(--peach)"
                : "var(--mint)",
          }}
        >
          Pipeline {!lastRun ? "jamais lancé" : lastRun.status === "error" ? "en erreur" : "OK"}
        </span>
        {lastRun && (
          <span className="text-sm">
            Dernier passage : {new Date(lastRun.started_at).toLocaleString("fr-FR")} —{" "}
            {lastRun.items_new} nouveaux items, {lastRun.articles_created} article(s)
          </span>
        )}
        {queueCount > 0 && (
          <span className="text-sm font-semibold">· {queueCount} news en file d&apos;attente</span>
        )}
        <span className="ml-auto text-sm font-semibold">Journal →</span>
      </Link>

      <div className="mt-6">
        <PipelineTrigger />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Derniers articles</h2>
        <Link href="/admin/articles/new" className="nb-btn nb-btn-primary text-sm">
          + Nouvel article
        </Link>
      </div>

      <div className="nb-card mt-4 divide-y-2 divide-ink">
        {recent.map((article) => (
          <div key={article.slug} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <Link
                href={`/admin/articles/${article.slug}`}
                className="font-semibold hover:underline"
              >
                {article.type === "tuto" && "🎓 "}
                {article.title}
              </Link>
              <p className="mt-0.5 text-xs text-ink/60">
                {formatDate(article.date)} · {article.views} vue{article.views !== 1 ? "s" : ""}
              </p>
            </div>
            <span
              className="nb-pill shrink-0"
              style={{
                background: article.published
                  ? "var(--mint)"
                  : article.scheduledAt
                    ? "var(--sky)"
                    : "var(--peach)",
              }}
            >
              {article.published
                ? "Publié"
                : article.scheduledAt
                  ? `Planifié ${new Date(article.scheduledAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                  : "Brouillon"}
            </span>
          </div>
        ))}
        {recent.length === 0 && <p className="p-6 text-sm">Aucun article.</p>}
      </div>

      <Link href="/admin/articles" className="mt-4 inline-block text-sm font-semibold underline">
        Tous les articles →
      </Link>
    </div>
  );
}
