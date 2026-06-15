import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticle,
  getRelatedArticles,
  readingTimeMinutes,
  localizeMeta,
  formatDate,
  getReactions,
} from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { CategoryBadge, Tag } from "@/components/Tag";
import { CoverPattern } from "@/components/CoverPattern";
import { AdSlot } from "@/components/AdSlot";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";
import { ReactionBar } from "@/components/ReactionBar";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ViewTracker } from "@/components/ViewTracker";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.date,
      ...(article.image ? { images: [{ url: article.image }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";
  const locale = en ? "en-GB" : "fr-FR";
  const loc = localizeMeta(article, lang);
  const html = en && article.htmlEn ? article.htmlEn : article.html;
  const showFrOnlyNote = en && !article.htmlEn;

  const reactions = getReactions(article.id);
  const related = await getRelatedArticles(slug, 3);
  const readingTime = readingTimeMinutes(html);
  const time = new Date(article.date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const longDate = new Date(article.date).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": article.type === "tuto" ? "TechArticle" : "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    inLanguage: "fr",
    ...(article.image ? { image: [article.image] } : {}),
    publisher: { "@type": "Organization", name: "signal·ia" },
  };

  return (
    <div className="-mt-10">
      <ReadingProgress />
      <ViewTracker slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── En-tête ── */}
      <section style={{ padding: "var(--s7) 0 var(--s4)" }}>
        <div className="wrap-n">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              href={article.type === "tuto" ? "/tutos" : "/actus"}
              className="btn btn-g font-mono text-[11px] text-[var(--ink-f)]"
              style={{ minHeight: 36, padding: "0 12px" }}
            >
              ← {article.type === "tuto" ? t.navTutos : t.navAllNews}
            </Link>
            <span className="text-[var(--ln-h)]">·</span>
            <CategoryBadge tags={article.tags} lang={lang} fallbackText={loc.title} />
            {article.tags.slice(0, 2).map((tg) => (
              <Tag key={tg} href={`/tags/${encodeURIComponent(tg)}`}>
                {tg}
              </Tag>
            ))}
          </div>

          <h1 className="mb-6 text-[clamp(28px,5vw,50px)] font-bold leading-[1.08] tracking-[-0.025em]">
            {loc.title}
          </h1>

          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1.5 border-b border-line pb-6 font-mono text-[12px] text-[var(--ink-f)]">
            <span className="capitalize">{longDate}</span>
            <span>{time}</span>
            <span>{readingTime} {en ? "min read" : "min de lecture"}</span>
            {article.sources.length > 0 && (
              <span className="text-[var(--ac)]">{t.sourcesCited(article.sources.length)}</span>
            )}
          </div>

          {showFrOnlyNote && (
            <p className="mb-6 border border-line px-3 py-2 font-mono text-[11px] uppercase text-[var(--ink-f)]" style={{ background: "var(--bg-r)" }}>
              {t.notTranslated}
            </p>
          )}
        </div>
      </section>

      {/* ── En résumé + image ── */}
      <section style={{ paddingBottom: "var(--s6)" }}>
        <div className="wrap-n">
          {loc.tldr.length > 0 && (
            <div
              className="mb-12 p-6"
              style={{
                background: "var(--bg-r)",
                border: "1px solid var(--ln-h)",
                borderLeft: "4px solid var(--ac)",
              }}
            >
              <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ac)]">
                <span className="inline-block h-1.5 w-1.5" style={{ background: "var(--ac)" }} />
                {t.keyPoints(loc.tldr.length)}
              </div>
              <ul className="flex flex-col gap-4">
                {loc.tldr.map((pt, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="mt-[3px] shrink-0 font-mono text-[12px] font-semibold text-[var(--ac)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[16px] leading-[1.5]">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="img-vignette has-scanlines relative h-[380px] overflow-hidden border border-line">
            {article.image ? (
              <Image
                src={article.image}
                alt={loc.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            ) : (
              <CoverPattern seed={article.slug} label={article.tags[0] ?? loc.title} />
            )}
          </div>
        </div>
      </section>

      {/* ── Corps ── */}
      <section style={{ paddingBottom: "var(--s7)" }}>
        <div className="wrap-n">
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

          <AdSlot position="article-bottom" />

          {/* Réactions + actions */}
          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
            <ReactionBar slug={slug} initial={reactions} lang={lang} />
            <div className="ml-auto flex items-center gap-3">
              <BookmarkButton slug={slug} title={loc.title} lang={lang} />
              <ShareButtons
                title={loc.title}
                url={`${siteUrl}/articles/${article.slug}`}
                labels={{ share: t.share, copy: t.copyLink, copied: t.copied }}
              />
            </div>
          </div>

          {/* Sources */}
          {article.sources.length > 0 && (
            <div className="mt-8 border border-line p-5" style={{ background: "var(--bg-d)" }}>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-f)]">
                {t.sources}
              </div>
              <div className="flex flex-wrap gap-3">
                {article.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[12px] text-[var(--ac)] transition-colors"
                    style={{ border: "1px solid var(--ac)", padding: "4px 10px", minHeight: 36 }}
                  >
                    {source.name} ↗
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tg) => (
              <Tag key={tg} href={`/tags/${encodeURIComponent(tg)}`}>
                {tg}
              </Tag>
            ))}
          </div>
        </div>
      </section>

      {/* ── Articles liés ── */}
      {related.length > 0 && (
        <section className="fullbleed band band-alt">
          <div className="wrap">
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="border-l-2 border-[var(--ac)] pl-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ac)]">
                  {t.alsoRead}
                </span>
                <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                  {en ? "Related articles" : "Articles liés"}
                </h2>
              </div>
              <Link href="/actus" className="font-mono text-[12px] text-[var(--ink-d)] transition-colors hover:text-[var(--ac)]">
                {en ? "See all" : "Voir tout"} →
              </Link>
            </div>
            <div className="mag">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
