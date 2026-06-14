import type { Metadata } from "next";
import { getAllArticles, getAllTags } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination, paginate, parsePage } from "@/components/Pagination";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Toutes les actus",
  description: "L'archive complète des actualités IA et robotique de signal·ia.",
};

const PERIODS: Record<string, number> = {
  "24h": 1,
  "7j": 7,
  "30j": 30,
};

export default async function ActusPage({ searchParams }: PageProps<"/actus">) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const tagFilter = typeof params.tag === "string" ? params.tag : "";
  const sourceFilter = typeof params.source === "string" ? params.source : "";
  const periodFilter = typeof params.periode === "string" ? params.periode : "";
  const lang = await getLang();
  const t = getDict(lang);

  const [allNews, tags] = await Promise.all([
    getAllArticles({ type: "news" }),
    getAllTags(),
  ]);

  // Sources distinctes présentes dans les actus
  const sourceNames = [
    ...new Set(allNews.flatMap((a) => a.sources.map((s) => s.name))),
  ].sort((a, b) => a.localeCompare(b));

  // Filtrage en mémoire
  let articles = allNews;
  if (tagFilter) articles = articles.filter((a) => a.tags.includes(tagFilter));
  if (sourceFilter) {
    articles = articles.filter((a) => a.sources.some((s) => s.name === sourceFilter));
  }
  if (PERIODS[periodFilter]) {
    const since = new Date(Date.now() - PERIODS[periodFilter] * 24 * 3600_000).toISOString();
    articles = articles.filter((a) => a.date >= since);
  }

  const { slice, totalPages } = paginate(articles, page);

  const query: Record<string, string> = {};
  if (tagFilter) query.tag = tagFilter;
  if (sourceFilter) query.source = sourceFilter;
  if (periodFilter) query.periode = periodFilter;

  const hasFilter = Boolean(tagFilter || sourceFilter || periodFilter);
  const tagOptions = tags.filter((x) => x.count >= 1).slice(0, 40);

  return (
    <div>
      <FadeUp>
        <header className="mb-8 max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.allNewsTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.allNewsIntro}</p>
        </header>
      </FadeUp>

      <FadeUp delay={0.04}>
        <form
          method="get"
          className="mb-8 flex flex-wrap items-end gap-3 border-y border-line py-4"
        >
          <label className="flex flex-col gap-1">
            <span className="meta uppercase text-[var(--ink-dim)]">{t.filterTag}</span>
            <select name="tag" defaultValue={tagFilter} className="field min-w-40">
              <option value="">{t.filterAllTags}</option>
              {tagOptions.map(({ tag, count }) => (
                <option key={tag} value={tag}>
                  {tag} ({count})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="meta uppercase text-[var(--ink-dim)]">{t.filterSource}</span>
            <select name="source" defaultValue={sourceFilter} className="field min-w-40">
              <option value="">{t.filterAllSources}</option>
              {sourceNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="meta uppercase text-[var(--ink-dim)]">{t.filterPeriod}</span>
            <select name="periode" defaultValue={periodFilter} className="field min-w-40">
              <option value="">{t.periodAll}</option>
              <option value="24h">{t.period24h}</option>
              <option value="7j">{t.period7d}</option>
              <option value="30j">{t.period30d}</option>
            </select>
          </label>

          <button type="submit" className="nb-btn nb-btn-primary">
            {t.filterApply}
          </button>
          {hasFilter && (
            <a href="/actus" className="nb-btn">
              {t.filterReset}
            </a>
          )}
        </form>
      </FadeUp>

      <p className="meta mb-6 uppercase">{t.weekArticles(articles.length)}</p>

      {articles.length === 0 ? (
        <p className="nb-card max-w-md p-6 text-sm text-[var(--ink-dim)]">{t.noResultFilter}</p>
      ) : (
        <>
          <div className="cards-grid">
            {slice.map((article, i) => (
              <FadeUp key={article.slug} delay={Math.min(i * 0.04, 0.2)} className="h-full">
                <ArticleCard article={article} lang={lang} />
              </FadeUp>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/actus"
            query={query}
            t={t}
          />
        </>
      )}
    </div>
  );
}
