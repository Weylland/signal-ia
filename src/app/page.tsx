import Link from "next/link";
import { getAllArticles, formatDate } from "@/lib/articles";

export default async function Home() {
  const articles = await getAllArticles();

  if (articles.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        Aucun article pour l&apos;instant. Le pipeline n&apos;a pas encore tourné.
      </p>
    );
  }

  const [featured, ...rest] = articles;

  return (
    <div className="flex flex-col gap-12">
      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
          À la une
        </p>
        <Link href={`/articles/${featured.slug}`} className="group block">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-5xl">
            {featured.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{featured.excerpt}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-muted">{formatDate(featured.date)}</span>
            {featured.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>
      </section>

      <section>
        <p className="mb-5 font-mono text-xs uppercase tracking-widest text-muted">
          Dernières news
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-dim hover:bg-surface-hover"
            >
              <span className="font-mono text-xs text-muted">{formatDate(article.date)}</span>
              <h2 className="mt-2 font-display text-xl font-semibold leading-snug transition-colors group-hover:text-accent">
                {article.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{article.excerpt}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
