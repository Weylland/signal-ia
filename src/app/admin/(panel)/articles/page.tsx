import Link from "next/link";
import { getAllArticles, formatDate } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  searchParams,
}: PageProps<"/admin/articles">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const filter = typeof params.statut === "string" ? params.statut : "tous";
  const perPage = [10, 20, 30].includes(Number(params.par_page))
    ? Number(params.par_page)
    : 20;
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1") || 1);

  let articles = await getAllArticles({ includeDrafts: true, search: search || undefined });
  if (filter === "publies") articles = articles.filter((a) => a.published);
  if (filter === "brouillons") articles = articles.filter((a) => !a.published);

  const totalPages = Math.max(1, Math.ceil(articles.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const slice = articles.slice((currentPage - 1) * perPage, currentPage * perPage);

  function pageHref(p: number) {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (filter !== "tous") qs.set("statut", filter);
    if (perPage !== 20) qs.set("par_page", String(perPage));
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return `/admin/articles${s ? `?${s}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">
          Articles
          <span className="ml-3 font-sans text-base font-normal text-[var(--ink-dim)]">
            {articles.length} au total
          </span>
        </h1>
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
        <select name="par_page" defaultValue={String(perPage)} className="field max-w-36">
          <option value="10">10 par page</option>
          <option value="20">20 par page</option>
          <option value="30">30 par page</option>
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
            {slice.map((article) => (
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
            {slice.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  Aucun article trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className="nb-btn text-xs">
              ← Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="meta uppercase">
            Page {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)} className="nb-btn text-xs">
              Suivant →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
