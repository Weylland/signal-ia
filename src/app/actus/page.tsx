import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, getAllTags } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { PageHeader, PageBand } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Toutes les actus",
  description: "L'archive complète des actualités IA et robotique de watch·ia.",
};

const PERIODS: Record<string, number> = { "24h": 1, "7j": 7, "30j": 30 };
const PER = 9;

export default async function ActusPage({ searchParams }: PageProps<"/actus">) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1") || 1);
  const tagFilter = typeof params.tag === "string" ? params.tag : "";
  const sourceFilter = typeof params.source === "string" ? params.source : "";
  const periodFilter = typeof params.periode === "string" ? params.periode : "";
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";

  const [allNews, tags] = await Promise.all([getAllArticles({ type: "news" }), getAllTags()]);
  const sourceNames = [...new Set(allNews.flatMap((a) => a.sources.map((s) => s.name)))].sort((a, b) =>
    a.localeCompare(b)
  );

  let articles = allNews;
  if (tagFilter) articles = articles.filter((a) => a.tags.includes(tagFilter));
  if (sourceFilter) articles = articles.filter((a) => a.sources.some((s) => s.name === sourceFilter));
  if (PERIODS[periodFilter]) {
    const since = new Date(Date.now() - PERIODS[periodFilter] * 24 * 3600_000).toISOString();
    articles = articles.filter((a) => a.date >= since);
  }

  const totalPages = Math.max(1, Math.ceil(articles.length / PER));
  const cur = Math.min(page, totalPages);
  const slice = articles.slice((cur - 1) * PER, cur * PER);

  const hasFilter = Boolean(tagFilter || sourceFilter || periodFilter);
  const tagOptions = tags.filter((x) => x.count >= 1).slice(0, 40);

  const qbase: Record<string, string> = {};
  if (tagFilter) qbase.tag = tagFilter;
  if (sourceFilter) qbase.source = sourceFilter;
  if (periodFilter) qbase.periode = periodFilter;
  const pageHref = (p: number) => {
    const q = new URLSearchParams(qbase);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/actus${s ? `?${s}` : ""}`;
  };

  return (
    <div className="-mt-10">
      <PageHeader
        title={t.allNewsTitle}
        subtitle={en ? `${allNews.length} articles · updated continuously` : `${allNews.length} articles · mis à jour en continu`}
      />
      <PageBand>
        <form method="get" className="mb-12 flex flex-wrap items-center gap-3">
          <select name="tag" defaultValue={tagFilter} className="inp inp-sm" style={{ width: "auto", minWidth: 150 }}>
            <option value="">{t.filterAllTags}</option>
            {tagOptions.map(({ tag, count }) => (
              <option key={tag} value={tag}>
                {tag} ({count})
              </option>
            ))}
          </select>
          <select name="source" defaultValue={sourceFilter} className="inp inp-sm" style={{ width: "auto", minWidth: 150 }}>
            <option value="">{t.filterAllSources}</option>
            {sourceNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select name="periode" defaultValue={periodFilter} className="inp inp-sm" style={{ width: "auto", minWidth: 150 }}>
            <option value="">{t.periodAll}</option>
            <option value="24h">{t.period24h}</option>
            <option value="7j">{t.period7d}</option>
            <option value="30j">{t.period30d}</option>
          </select>
          <button type="submit" className="btn btn-sm btn-p">
            {t.filterApply}
          </button>
          {hasFilter && (
            <a href="/actus" className="btn btn-sm btn-g text-[var(--ink-f)]">
              × {t.filterReset}
            </a>
          )}
          <span className="ml-auto font-mono text-[11px] text-[var(--ink-f)]">
            {articles.length} {en ? "results" : "résultats"}
          </span>
        </form>

        {slice.length === 0 ? (
          <div className="py-24 text-center font-mono text-[14px] text-[var(--ink-f)]">
            {t.noResultFilter}
          </div>
        ) : (
          <div className="mag mb-12">
            {slice.map((a) => (
              <ArticleCard key={a.slug} article={a} lang={lang} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {cur > 1 && (
              <Link href={pageHref(cur - 1)} className="btn btn-sm">
                ← {en ? "Prev" : "Préc."}
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={pageHref(p)} className={`btn btn-sm${p === cur ? " btn-p" : ""}`}>
                {p}
              </Link>
            ))}
            {cur < totalPages && (
              <Link href={pageHref(cur + 1)} className="btn btn-sm">
                {en ? "Next" : "Suiv."} →
              </Link>
            )}
          </div>
        )}
      </PageBand>
    </div>
  );
}
