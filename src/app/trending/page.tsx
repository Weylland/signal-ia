import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingArticles, getAllTags, localizeMeta, formatDate } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeIn, FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trending — signal·ia",
  description: "Les articles IA les plus lus et les plus réagis de la semaine.",
};

export default async function TrendingPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const [trending, tags] = await Promise.all([
    getTrendingArticles(12),
    getAllTags(),
  ]);

  const hotTags = tags
    .filter((t) => t.count >= 2)
    .slice(0, 15);

  return (
    <div>
      <FadeIn>
        <header className="mb-10 border-b border-line pb-8">
          <div className="section-head">
            <span className="idx">↑</span>
            <h1>{lang === "en" ? "Trending this week" : "Tendances cette semaine"}</h1>
          </div>
          <p className="mt-3 max-w-[56ch] text-[var(--ink-dim)]">
            {lang === "en"
              ? "The most read and most discussed AI articles over the last 7 days."
              : "Les articles IA les plus lus et les plus discutés des 7 derniers jours."}
          </p>
        </header>
      </FadeIn>

      {trending.length > 0 ? (
        <>
          {/* Top 3 podium */}
          <FadeUp>
            <section className="mb-12">
              <div className="section-head mb-6">
                <span className="idx">01</span>
                <h2>{lang === "en" ? "Top articles" : "Top articles"}</h2>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {trending.slice(0, 3).map((article, i) => {
                  const loc = localizeMeta(article, lang);
                  return (
                    <FadeUp key={article.slug} delay={i * 0.07}>
                      <article className="nb-card flex flex-col gap-3 p-5 h-full">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-5xl text-[var(--ink-faint)]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-2">
                            {article.views > 0 && (
                              <span className="meta uppercase">{article.views} vues</span>
                            )}
                            {article.breaking && (
                              <span className="nb-pill tag--hot">
                                {lang === "en" ? "Breaking" : "À chaud"}
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="font-display text-xl leading-snug text-balance">
                          <Link
                            href={`/articles/${article.slug}`}
                            className="transition-colors hover:text-[var(--accent)]"
                          >
                            {loc.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-[var(--ink-dim)] line-clamp-2">{loc.excerpt}</p>
                        <div className="meta mt-auto flex gap-3 pt-2 uppercase">
                          <span>{formatDate(article.date, lang)}</span>
                          {article.tags[0] && <span>{article.tags[0]}</span>}
                        </div>
                      </article>
                    </FadeUp>
                  );
                })}
              </div>
            </section>
          </FadeUp>

          {/* Rest as cards */}
          {trending.length > 3 && (
            <FadeUp>
              <section className="mb-12">
                <div className="section-head mb-6">
                  <span className="idx">02</span>
                  <h2>{lang === "en" ? "Also popular" : "Aussi populaires"}</h2>
                </div>
                <div className="cards-grid">
                  {trending.slice(3).map((article) => (
                    <ArticleCard key={article.slug} article={article} lang={lang} />
                  ))}
                </div>
              </section>
            </FadeUp>
          )}
        </>
      ) : (
        <p className="text-[var(--ink-dim)]">
          {lang === "en" ? "Not enough data yet." : "Pas encore assez de données."}
        </p>
      )}

      {hotTags.length > 0 && (
        <FadeUp>
          <section className="border-t border-line pt-8">
            <div className="section-head mb-5">
              <span className="idx">03</span>
              <h2>{lang === "en" ? "Trending topics" : "Sujets du moment"}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotTags.map(({ tag, count }) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="nb-pill">
                  {tag} <span className="ml-1.5 text-[var(--accent)]">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        </FadeUp>
      )}
    </div>
  );
}
