import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, getArticle, formatDate } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeIn, FadeUp } from "@/components/Reveal";

const pillColors = ["var(--sunshine)", "var(--mint)", "var(--sky)", "var(--peach)"];

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

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

  const related = (await getAllArticles())
    .filter((a) => a.slug !== slug)
    .sort((a, b) => {
      const aShared = a.tags.filter((t) => article.tags.includes(t)).length;
      const bShared = b.tags.filter((t) => article.tags.includes(t)).length;
      return bShared - aShared || b.date.localeCompare(a.date);
    })
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    inLanguage: "fr",
    ...(article.image ? { image: [article.image] } : {}),
    publisher: { "@type": "Organization", name: "signal·ia" },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FadeIn>
        <article className="mx-auto max-w-3xl">
          <Link href="/" className="nb-navlink text-sm font-semibold">
            ← Toutes les actualités
          </Link>

          <header className="mb-8 mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                {formatDate(article.date)}
              </span>
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

          {article.sources.length > 0 && (
            <footer className="nb-card mt-12 bg-cream-2 p-6">
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
