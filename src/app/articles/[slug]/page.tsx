import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, getArticle, formatDate } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeIn, FadeUp } from "@/components/Reveal";

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
          <Link href="/" className="text-sm text-muted transition-colors hover:text-accent-deep">
            ← Toutes les actualités
          </Link>

          <header className="mb-8 mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {formatDate(article.date)}
              </span>
              {article.tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="pill">
                  {tag}
                </Link>
              ))}
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {article.title}
            </h1>
          </header>

          {article.image && (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
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
            <footer className="mt-12 rounded-2xl border border-border bg-surface p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Pour aller plus loin
              </p>
              <ul className="flex flex-col gap-2">
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent-deep underline underline-offset-4 hover:text-accent"
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
            <h2 className="mb-6 font-display text-2xl font-semibold">À lire ensuite</h2>
          </FadeUp>
          <div className="grid gap-6 sm:grid-cols-3">
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
