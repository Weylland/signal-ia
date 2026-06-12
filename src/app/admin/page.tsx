import Link from "next/link";
import { getAllArticles, formatDate } from "@/lib/articles";
import { AdminBar } from "@/components/admin/AdminBar";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const articles = await getAllArticles();

  return (
    <div>
      <AdminBar title="Tableau de bord" />

      <div className="card overflow-x-auto !rounded-2xl p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-5 py-3 font-medium">Titre</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Tags</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.slug} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium">{article.title}</td>
                <td className="whitespace-nowrap px-5 py-3 text-muted">
                  {formatDate(article.date)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <span key={tag} className="pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="mr-3 text-muted hover:text-accent-deep"
                  >
                    Voir
                  </Link>
                  <Link
                    href={`/admin/articles/${article.slug}`}
                    className="font-medium text-accent-deep hover:text-accent"
                  >
                    Éditer
                  </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  Aucun article. Crée le premier !
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-muted">
        {articles.length} article{articles.length > 1 ? "s" : ""} publié
        {articles.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}
