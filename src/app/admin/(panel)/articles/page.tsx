import Link from "next/link";
import { getAllArticles, formatDate } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  searchParams,
}: PageProps<"/admin/articles">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const filter = typeof params.statut === "string" ? params.statut : "tous";

  let articles = await getAllArticles({ includeDrafts: true, search: search || undefined });
  if (filter === "publies") articles = articles.filter((a) => a.published);
  if (filter === "brouillons") articles = articles.filter((a) => !a.published);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Articles</h1>
        <Link href="/admin/articles/new" className="nb-btn nb-btn-primary text-sm">
          + Nouvel article
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Rechercher..."
          className="field max-w-xs"
        />
        <select name="statut" defaultValue={filter} className="field max-w-44">
          <option value="tous">Tous les statuts</option>
          <option value="publies">Publiés</option>
          <option value="brouillons">Brouillons</option>
        </select>
        <button type="submit" className="nb-btn text-sm">
          Filtrer
        </button>
      </form>

      <div className="nb-card mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink bg-[var(--cream-2)] text-left text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-bold">Titre</th>
              <th className="px-4 py-3 font-bold">Statut</th>
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Tags</th>
              <th className="px-4 py-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink/10">
            {articles.map((article) => (
              <tr key={article.slug}>
                <td className="px-4 py-3 font-semibold">{article.title}</td>
                <td className="px-4 py-3">
                  <span
                    className="nb-pill"
                    style={{ background: article.published ? "var(--mint)" : "var(--peach)" }}
                  >
                    {article.published ? "Publié" : "Brouillon"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(article.date)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <span key={tag} className="nb-pill bg-[var(--sky)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {article.published && (
                    <Link href={`/articles/${article.slug}`} className="mr-3 underline">
                      Voir
                    </Link>
                  )}
                  <Link
                    href={`/admin/articles/${article.slug}`}
                    className="font-bold underline"
                  >
                    Éditer
                  </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
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
