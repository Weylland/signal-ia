import type { Metadata } from "next";
import Link from "next/link";
import { searchArticlesFts, getAllTags, getMostViewedArticles } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleRow } from "@/components/ArticleRow";
import { PageHeader, PageBand } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Rechercher dans les actualités et tutos IA de signal·ia.",
  robots: { index: false },
};

export default async function RecherchePage({ searchParams }: PageProps<"/recherche">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";

  const results = query ? await searchArticlesFts(query) : [];
  const [tags, mostViewed] = query ? [[], []] : await Promise.all([getAllTags(), getMostViewedArticles(5)]);
  const exploreTags = (tags as { tag: string; count: number }[]).filter((x) => x.count >= 2).slice(0, 20);

  return (
    <div className="-mt-10">
      <PageHeader title={t.searchTitle}>
        <form method="get" className="mt-5 flex max-w-[600px] gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t.searchPlaceholder}
            className="inp flex-1 text-[16px]"
            autoFocus
          />
          <button type="submit" className="btn btn-p btn-lg shrink-0">
            {t.searchButton}
          </button>
        </form>
      </PageHeader>

      <PageBand>
        {query ? (
          <>
            <div className="mb-6 font-mono text-[12px] text-[var(--ink-f)]">
              {t.searchResults(results.length, query)}
            </div>
            {results.length === 0 ? (
              <div className="py-24 text-center font-mono text-[14px] text-[var(--ink-f)]">
                {en ? "No results. Try another term or check the " : "Aucun résultat. Essayez un autre terme ou consultez le "}
                <Link href="/glossaire" className="text-[var(--ac)] underline">
                  {en ? "glossary" : "glossaire"}
                </Link>
                .
              </div>
            ) : (
              <div>
                {results.map((a) => (
                  <ArticleRow key={a.slug} article={a} lang={lang} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2">
            {exploreTags.length > 0 && (
              <div>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                  {t.searchHint}
                </div>
                <div className="flex flex-wrap gap-2">
                  {exploreTags.map(({ tag, count }) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag">
                      {tag}
                      <span className="ml-1.5 text-[var(--ac)]">{count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {mostViewed.length > 0 && (
              <div>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                  {t.mostRead}
                </div>
                {mostViewed.map((a, i) => (
                  <ArticleRow key={a.slug} article={a} lang={lang} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </PageBand>
    </div>
  );
}
