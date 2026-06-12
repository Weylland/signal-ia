import Link from "next/link";
import { getAllArticles, getStats, formatDate } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, articles] = await Promise.all([
    getStats(),
    getAllArticles({ includeDrafts: true }),
  ]);
  const recent = articles.slice(0, 5);

  const cards = [
    { label: "Articles", value: stats.total, color: "var(--sunshine)" },
    { label: "Publiés", value: stats.published, color: "var(--mint)" },
    { label: "Brouillons", value: stats.drafts, color: "var(--peach)" },
    { label: "Tags", value: stats.tags, color: "var(--sky)" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Tableau de bord</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="nb-card p-5" style={{ background: card.color }}>
            <p className="font-display text-4xl font-bold">{card.value}</p>
            <p className="mt-1 text-sm font-semibold">{card.label}</p>
          </div>
        ))}
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
                {article.title}
              </Link>
              <p className="mt-0.5 text-xs text-ink/60">{formatDate(article.date)}</p>
            </div>
            <span
              className="nb-pill shrink-0"
              style={{ background: article.published ? "var(--mint)" : "var(--peach)" }}
            >
              {article.published ? "Publié" : "Brouillon"}
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
