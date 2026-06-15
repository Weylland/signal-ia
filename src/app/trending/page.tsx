import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingArticles, getAllTags } from "@/lib/articles";
import { categoryFor } from "@/lib/category";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { PageHeader, PageBand } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tendances — signal·ia",
  description: "Les sujets IA les plus discutés de la semaine.",
};

export default async function TrendingPage() {
  const lang = await getLang();
  const en = lang === "en";
  const [trending, tags] = await Promise.all([getTrendingArticles(6), getAllTags()]);

  const trends = tags.filter((t) => t.count >= 1).slice(0, 10);
  const maxCount = Math.max(1, ...trends.map((t) => t.count));

  return (
    <div className="-mt-10">
      <PageHeader
        title={en ? "Trending" : "Tendances"}
        subtitle={
          en
            ? "The most discussed topics in the AI ecosystem this week."
            : "Les sujets les plus discutés cette semaine dans l'écosystème IA."
        }
      />
      <PageBand>
        <div className="flex flex-col gap-3">
          {trends.map(({ tag, count }, i) => {
            const cat = categoryFor([tag], lang, tag);
            const color = cat.cls
              ? `var(--c-${cat.cls.replace("t-", "")})`
              : "var(--ink-f)";
            return (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="card-mag flex items-center gap-5 px-5 py-4"
              >
                <span className="w-8 shrink-0 text-right font-mono text-[18px] font-bold text-[var(--ln-h)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="text-[16px] font-semibold">{tag}</span>
                    {cat.label && <span className={`tag${cat.cls ? " " + cat.cls : ""}`}>{cat.label}</span>}
                  </div>
                  <div className="relative h-1.5 overflow-hidden" style={{ background: "var(--bg-d)" }}>
                    <div
                      className="absolute left-0 top-0 h-full"
                      style={{ width: `${(count / maxCount) * 100}%`, background: color }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold">{count}</div>
                  <div className="font-mono text-[11px] text-[var(--ink-f)]">
                    {en ? "articles" : "articles"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {trending.length > 0 && (
          <>
            <div className="mb-8 mt-16 flex items-center gap-3">
              <span className="border-l-2 border-[var(--ac)] pl-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ac)]">
                {en ? "Popular" : "Populaire"}
              </span>
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                {en ? "Most read" : "Les plus lus"}
              </h2>
            </div>
            <div className="mag">
              {trending.map((a) => (
                <ArticleCard key={a.slug} article={a} lang={lang} />
              ))}
            </div>
          </>
        )}
      </PageBand>
    </div>
  );
}
