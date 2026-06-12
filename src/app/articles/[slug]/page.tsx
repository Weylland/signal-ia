import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, getArticle, formatDate } from "@/lib/articles";

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
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="font-mono text-xs text-muted transition-colors hover:text-accent"
      >
        ← retour aux news
      </Link>

      <header className="mb-10 mt-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-muted">{formatDate(article.date)}</span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-accent"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {article.title}
        </h1>
      </header>

      <div className="prose-article" dangerouslySetInnerHTML={{ __html: article.html }} />

      {article.sources.length > 0 && (
        <footer className="mt-12 rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Sources</p>
          <ul className="flex flex-col gap-2">
            {article.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent underline underline-offset-4"
                >
                  {source.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
