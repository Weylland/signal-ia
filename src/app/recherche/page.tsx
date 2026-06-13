import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, getAllTags, getMostViewedArticles, localizeMeta } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination, paginate, parsePage } from "@/components/Pagination";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Rechercher dans les actualités et tutos IA de signal·ia.",
  robots: { index: false },
};

export default async function RecherchePage({ searchParams }: PageProps<"/recherche">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const page = parsePage(params.page);
  const lang = await getLang();
  const t = getDict(lang);

  const results = query ? await getAllArticles({ search: query }) : [];
  const { slice, totalPages } = paginate(results, page);

  const [tags, mostViewed] = query
    ? [[], []]
    : await Promise.all([getAllTags(), getMostViewedArticles(5)]);

  return (
    <div>
      <FadeUp>
        <header className="mb-8 max-w-xl">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.searchTitle}</h1>
          <form method="get" className="mt-6 flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t.searchPlaceholder}
              className="field flex-1"
              autoFocus
            />
            <button type="submit" className="nb-btn nb-btn-primary">
              {t.searchButton}
            </button>
          </form>
        </header>
      </FadeUp>

      {query ? (
        <>
          <p className="meta mb-6 uppercase">{t.searchResults(results.length, query)}</p>
          <div className="cards-grid">
            {slice.map((article, i) => (
              <FadeUp key={article.slug} delay={Math.min(i * 0.05, 0.25)} className="h-full">
                <ArticleCard article={article} lang={lang} />
              </FadeUp>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/recherche"
            query={{ q: query }}
            t={t}
          />
        </>
      ) : (
        <div className="grid gap-10 lg:grid-cols-2">
          {tags.length > 0 && (
            <FadeUp>
              <section>
                <div className="section-head">
                  <span className="idx">→</span>
                  <h2>{t.searchHint}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(({ tag, count }) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="nb-pill">
                      {tag} <span className="ml-1.5 text-[var(--accent)]">{count}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </FadeUp>
          )}
          {mostViewed.length > 0 && (
            <FadeUp delay={0.08}>
              <section>
                <div className="section-head">
                  <span className="idx">★</span>
                  <h2>{t.mostRead}</h2>
                </div>
                <ol className="flex flex-col">
                  {mostViewed.map((a, i) => (
                    <li key={a.slug} className="flex items-baseline gap-4 border-b border-line py-3">
                      <span className="font-display text-2xl text-[var(--ink-faint)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="text-sm font-medium transition-colors hover:text-[var(--accent)]"
                      >
                        {localizeMeta(a, lang).title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            </FadeUp>
          )}
        </div>
      )}
    </div>
  );
}
