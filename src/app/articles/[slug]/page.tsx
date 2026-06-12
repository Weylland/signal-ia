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

  const related = await getRelatedArticles(slug, 4);
  const readingTime = readingTimeMinutes(article.html);
  const time = new Date(article.date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
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
    <div>
      <ReadingProgress />
      <ViewTracker slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="meta -mt-10 -mx-5 mb-0 border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-2.5 uppercase">
          <Link href="/" className="transition-colors hover:text-[var(--accent)]">
            Accueil
          </Link>
          <span className="opacity-40">/</span>
          <Link
            href={article.type === "tuto" ? "/tutos" : "/"}
            className="transition-colors hover:text-[var(--accent)]"
          >
            {article.type === "tuto" ? "Tutos" : "Actu"}
          </Link>
          <span className="opacity-40">/</span>
          <span className="truncate text-[var(--ink-dim)]">{article.title}</span>
        </div>
      </div>

      <FadeIn>
        <header className="border-b border-line py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2">
            {article.breaking && <span className="nb-pill tag--hot">À chaud</span>}
            {article.type === "tuto" && <span className="nb-pill tag--hot">Tuto</span>}
            {article.tags.map((tag) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="nb-pill">
                {tag}
              </Link>
            ))}
          </div>
          <h1 className="font-display mt-5 max-w-[18ch] text-4xl leading-[1.04] tracking-tight text-balance sm:text-6xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-[var(--ink-dim)]">
              {article.excerpt}
            </p>
          )}
          <div className="meta mt-6 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-line pt-3.5 uppercase">
            <span>
              {formatDate(article.date)} · {time}
            </span>
            <span>Lecture {readingTime} min</span>
            {article.sources.length > 0 && (
              <span>
                {article.sources.length} source{article.sources.length > 1 ? "s" : ""} citée
                {article.sources.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </header>
      </FadeIn>

      <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_296px]">
        <article>
          {article.image && (
            <div className="relative mb-9 aspect-[16/8] overflow-hidden border border-line">
              <Image
                src={article.image}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 65vw"
                className="object-cover"
              />
            </div>
          )}

          {article.tldr.length > 0 && (
            <aside className="essentiel mb-9" aria-label="L'essentiel">
              <div className="e-head">
                L&apos;essentiel — {article.tldr.length} point{article.tldr.length > 1 ? "s" : ""}
              </div>
              <ol>
                {article.tldr.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ol>
            </aside>
          )}

          <div className="prose-article" dangerouslySetInnerHTML={{ __html: article.html }} />

          <AdSlot position="article-bottom" />

          {article.sources.length > 0 && (
            <div className="sources-list">
              <h4>Sources citées</h4>
              <ul>
                {article.sources.map((source, i) => (
                  <li key={source.url}>
                    <span className="n">[{i + 1}]</span>
                    <span>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.name}
                      </a>{" "}
                      <span className="text-[var(--ink-faint)]">
                        — {new URL(source.url).hostname.replace(/^www\./, "")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 border-t border-line pt-5">
            <ShareButtons title={article.title} url={`${siteUrl}/articles/${article.slug}`} />
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-7 flex flex-col gap-5">
            {related.length > 0 && (
              <div className="border border-line bg-[var(--bg-raised)]">
                <h4 className="meta border-b border-line px-4 py-2.5 font-semibold uppercase">
                  À lire aussi
                </h4>
                <ul>
                  {related.map((a) => (
                    <li key={a.slug} className="border-t border-line px-4 py-3 text-sm leading-snug first:border-t-0">
                      <span className="meta mb-1 block uppercase">
                        {new Date(a.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        {a.tags[0] ? ` · ${a.tags[0]}` : ""}
                      </span>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="transition-colors hover:text-[var(--accent)]"
                      >
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border border-line bg-[var(--bg-raised)]">
              <h4 className="meta border-b border-line px-4 py-2.5 font-semibold uppercase">
                Newsletter
              </h4>
              <div className="p-4">
                <p className="mb-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                  Le récap de la semaine, un email le dimanche.
                </p>
                <Link href="/#newsletter" className="kicker border-b border-[var(--accent)] pb-0.5">
                  S&apos;inscrire →
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line pt-10 lg:hidden">
          <FadeUp>
            <div className="section-head">
              <span className="idx">→</span>
              <h2>À lire aussi</h2>
            </div>
          </FadeUp>
          <div className="cards-grid">
            {related.slice(0, 3).map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
