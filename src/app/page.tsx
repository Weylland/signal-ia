import Image from "next/image";
import Link from "next/link";
import {
  getAllArticles,
  getAllTags,
  getBreakingArticles,
  getMostViewedArticles,
  localizeMeta,
  formatDate,
  type ArticleMeta,
} from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { getLang, getDict, type Lang, type Dict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSlot";
import { FadeIn, FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

function hourLabel(iso: string, lang: Lang): string {
  const date = new Date(iso);
  const locale = lang === "en" ? "en-GB" : "fr-FR";
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

function FeedItem({ article, lang, t }: { article: ArticleMeta; lang: Lang; t: Dict }) {
  const loc = localizeMeta(article, lang);
  return (
    <div className="feed-item">
      <time>{hourLabel(article.date, lang)}</time>
      <span className={`nb-pill ${article.breaking ? "tag--hot" : ""}`}>
        {article.breaking ? t.breaking : (article.tags[0] ?? t.news)}
      </span>
      <span className="t">
        <Link href={`/articles/${article.slug}`} className="transition-colors">
          {loc.title}
        </Link>
      </span>
    </div>
  );
}

export default async function Home() {
  const settings = getSettings();
  const lang = await getLang();
  const t = getDict(lang);

  if (settings.maintenanceMode) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="font-display text-4xl">{t.maintenanceTitle}</p>
        <p className="mt-4 text-[var(--ink-dim)]">{t.maintenanceBody}</p>
      </div>
    );
  }

  const [articles, tags, breaking, mostViewed, tutos] = await Promise.all([
    getAllArticles({ type: "news" }),
    getAllTags(),
    getBreakingArticles(),
    getMostViewedArticles(4),
    getAllArticles({ type: "tuto", limit: 3 }),
  ]);

  if (articles.length === 0 && tutos.length === 0) {
    return <p className="text-sm">{t.noArticles}</p>;
  }

  const [featured, second, third, ...rest] = articles;
  const featuredLoc = featured ? localizeMeta(featured, lang) : null;
  const also = [second, third].filter(Boolean) as ArticleMeta[];
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
  const last24h = articles.filter((a) => a.date >= dayAgo);
  const feedSplit = Math.ceil(Math.min(last24h.length, 10) / 2);
  const grid = rest.slice(0, 9);

  return (
    <div className="flex flex-col gap-12">
      {breaking.length > 0 && (
        <div className="breaking-bar -mx-5 -mt-10" role="region" aria-label={t.breaking}>
          <div className="label">
            <span className="blink" />
            {t.breaking}
          </div>
          <div className="track">
            <div className="reel">
              {[false, true].map((hidden) => (
                <span
                  key={String(hidden)}
                  aria-hidden={hidden || undefined}
                  className="flex items-center"
                >
                  {breaking.map((a) => (
                    <span key={a.slug} className="flex items-center">
                      <Link href={`/articles/${a.slug}`} className="item">
                        <b>{hourLabel(a.date, lang)}</b> — {localizeMeta(a, lang).title}
                      </Link>
                      <span className="sep">///</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {featured && featuredLoc && (
        <FadeIn>
          <section className="border-b border-line pb-10">
            <div className="grid items-start gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  {featured.tags[0] && <span className="nb-pill tag--hot">{featured.tags[0]}</span>}
                  <span className="meta uppercase">{formatDate(featured.date, lang)}</span>
                </div>
                <h1 className="font-display mt-4 text-4xl leading-[1.04] tracking-tight text-balance sm:text-6xl">
                  <Link
                    href={`/articles/${featured.slug}`}
                    className="transition-colors hover:text-[var(--accent)]"
                  >
                    {featuredLoc.title}
                  </Link>
                </h1>
                <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-[var(--ink-dim)]">
                  {featuredLoc.excerpt}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {featured.sources.length > 0 && (
                    <span className="meta uppercase">{t.sourcesCited(featured.sources.length)}</span>
                  )}
                  <Link href={`/articles/${featured.slug}`} className="nb-btn nb-btn-primary">
                    {t.readArticle}
                  </Link>
                </div>
              </div>
              {featured.image && (
                <figure className="order-first lg:order-none">
                  <Link
                    href={`/articles/${featured.slug}`}
                    className="relative block aspect-[4/3] overflow-hidden border border-line"
                  >
                    <Image
                      src={featured.image}
                      alt={featuredLoc.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover"
                    />
                  </Link>
                </figure>
              )}
            </div>

            {also.length > 0 && (
              <div className="mt-9 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
                {also.map((a) => (
                  <article
                    key={a.slug}
                    className="sm:border-l sm:border-line sm:pl-5 sm:first:border-l-0 sm:first:pl-0"
                  >
                    <span className="meta uppercase">
                      {hourLabel(a.date, lang)} · {a.tags[0] ?? t.news}
                    </span>
                    <h3 className="font-display mt-2 text-xl leading-snug text-balance">
                      <Link
                        href={`/articles/${a.slug}`}
                        className="transition-colors hover:text-[var(--accent)]"
                      >
                        {localizeMeta(a, lang).title}
                      </Link>
                    </h3>
                  </article>
                ))}
              </div>
            )}
          </section>
        </FadeIn>
      )}

      <AdSlot position="home-top" />

      {last24h.length > 1 && (
        <FadeUp>
          <section>
            <div className="section-head">
              <span className="idx">01</span>
              <h2>{t.last24h}</h2>
              <Link href="/cette-semaine" className="more">
                {t.fullFeed}
              </Link>
            </div>
            <div className="grid gap-x-12 lg:grid-cols-2">
              <div>
                {last24h.slice(0, feedSplit).map((a) => (
                  <FeedItem key={a.slug} article={a} lang={lang} t={t} />
                ))}
              </div>
              <div>
                {last24h.slice(feedSplit, 10).map((a) => (
                  <FeedItem key={a.slug} article={a} lang={lang} t={t} />
                ))}
              </div>
            </div>
          </section>
        </FadeUp>
      )}

      <FadeUp>
        <section>
          <div className="section-head">
            <span className="idx">02</span>
            <h2>{t.news}</h2>
            <Link href="/actus" className="more">
              {t.navAllNews} →
            </Link>
          </div>
          <div className="cards-grid">
            {grid.map((article) => (
              <ArticleCard key={article.slug} article={article} lang={lang} />
            ))}
          </div>
        </section>
      </FadeUp>

      <AdSlot position="home-middle" />

      {tutos.length > 0 && (
        <FadeUp>
          <section className="-mx-5 bg-[var(--accent)] px-5 py-10 text-[var(--on-accent)]">
            <div className="section-head !border-t-[var(--on-accent)]">
              <span className="idx !text-[var(--on-accent)]">03</span>
              <h2 className="!text-[var(--on-accent)]">{t.tutosSection}</h2>
              <Link
                href="/tutos"
                className="more !border-[var(--on-accent)] !text-[var(--on-accent)]"
              >
                {t.allTutos}
              </Link>
            </div>
            <p className="font-display -mt-1 mb-8 max-w-[30ch] text-3xl leading-tight sm:text-4xl">
              {t.tutosPitch}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tutos.map((tuto) => {
                const loc = localizeMeta(tuto, lang);
                return (
                  <article
                    key={tuto.slug}
                    className="flex flex-col border border-[var(--on-accent)] bg-[var(--bg-deep)] text-[var(--ink)] transition-transform hover:-translate-y-0.5"
                  >
                    <div className="meta flex items-center justify-between gap-2 border-b border-line px-4 py-2.5 uppercase">
                      <span>{t.guide}</span>
                      <span className="text-[var(--accent)]">{hourLabel(tuto.date, lang)}</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="font-display text-xl leading-snug text-balance">
                        <Link
                          href={`/articles/${tuto.slug}`}
                          className="transition-colors hover:text-[var(--accent)]"
                        >
                          {loc.title}
                        </Link>
                      </h3>
                      <p className="line-clamp-2 text-sm text-[var(--ink-dim)]">{loc.excerpt}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </FadeUp>
      )}

      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        {mostViewed.length > 0 && (
          <FadeUp>
            <section>
              <div className="section-head">
                <span className="idx">04</span>
                <h2>{t.mostRead}</h2>
              </div>
              <ol className="flex flex-col">
                {mostViewed.map((a, i) => (
                  <li key={a.slug} className="flex items-baseline gap-4 border-b border-line py-3">
                    <span className="font-display text-3xl text-[var(--ink-faint)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Link
                      href={`/articles/${a.slug}`}
                      className="font-medium transition-colors hover:text-[var(--accent)]"
                    >
                      {localizeMeta(a, lang).title}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </FadeUp>
        )}

        {tags.length > 0 && (
          <FadeUp>
            <section>
              <div className="section-head">
                <span className="idx">→</span>
                <h2>{t.explore}</h2>
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
      </div>
    </div>
  );
}
