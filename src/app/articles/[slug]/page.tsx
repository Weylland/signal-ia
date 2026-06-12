import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticle,
  getRelatedArticles,
  readingTimeMinutes,
  formatDate,
} from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSlot";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";
import { ViewTracker } from "@/components/ViewTracker";
import { FadeIn, FadeUp } from "@/components/Reveal";

const pillColors = ["var(--sunshine)", "var(--mint)", "var(--sky)", "var(--peach)"];

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

  const related = await getRelatedArticles(slug);
  const readingTime = readingTimeMinutes(article.html);

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
    <div>
      <ReadingProgress />
      <ViewTracker slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FadeIn>
        <article className="mx-auto max-w-3xl">
          <Link
            href={article.type === "tuto" ? "/tutos" : "/"}
            className="nb-navlink text-sm font-semibold"
          >
            ← {article.type === "tuto" ? "Tous les tutos" : "Toutes les actualités"}
          </Link>

          <header className="mb-8 mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {article.breaking && (
                <span className="nb-pill animate-pulse bg-[var(--peach)]">🔴 À chaud</span>
              )}
              {article.type === "tuto" && <span className="nb-pill bg-[var(--sky)]">🎓 Tuto</span>}
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                {formatDate(article.date)}
              </span>
              <span className="text-xs text-ink/60">· {readingTime} min de lecture</span>
              {article.tags.map((tag, i) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="nb-pill"
                  style={{ background: pillColors[i % pillColors.length] }}
                >
                  {tag}
                </Link>
              ))}
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              <span className="highlight">{article.title}</span>
            </h1>
          </header>

          {article.tldr.length > 0 && (
            <aside className="nb-card mb-10 bg-[var(--sunshine)] p-6">
              <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider">
                ⚡ L&apos;essentiel en {article.tldr.length} point{article.tldr.length > 1 ? "s" : ""}
              </p>
              <ul className="flex flex-col gap-2">
                {article.tldr.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm font-medium leading-relaxed">
                    <span className="font-display font-bold">{i + 1}.</span>
                    {point}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {article.image && (
            <div className="nb-card relative mb-10 aspect-[16/9] overflow-hidden p-0">
              <Image
                src={article.image}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          <div className="prose-article" dangerouslySetInnerHTML={{ __html: article.html }} />

          <AdSlot position="article-bottom" />

          <div className="mt-10 border-t-2 border-ink pt-6">
            <ShareButtons title={article.title} url={`${siteUrl}/articles/${article.slug}`} />
          </div>

          {article.sources.length > 0 && (
            <footer className="nb-card mt-8 bg-cream-2 p-6">
              <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider">
                Pour aller plus loin
              </p>
              <ul className="flex flex-col gap-2">
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nb-navlink text-sm font-semibold"
                    >
                      {source.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </article>
      </FadeIn>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl">
          <FadeUp>
            <h2 className="mb-6 font-display text-2xl font-bold">
              <span className="highlight-peach">À lire ensuite</span>
            </h2>
          </FadeUp>
          <div className="grid gap-7 sm:grid-cols-3">
            {related.map((a, i) => (
              <FadeUp key={a.slug} delay={i * 0.08}>
                <ArticleCard article={a} />
              </FadeUp>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
