import Image from "next/image";
import Link from "next/link";
import { getAllArticles, getAllTags, formatDate } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeIn, FadeUp } from "@/components/Reveal";

export default async function Home() {
  const [articles, tags] = await Promise.all([getAllArticles(), getAllTags()]);

  if (articles.length === 0) {
    return <p className="text-sm text-muted">Aucun article publié pour l&apos;instant.</p>;
  }

  const [featured, ...rest] = articles;

  return (
    <div className="flex flex-col gap-14">
      <FadeIn>
        <section className="card overflow-hidden !shadow-none sm:grid sm:grid-cols-2">
          <Link
            href={`/articles/${featured.slug}`}
            className="card-image relative block aspect-[16/10] overflow-hidden bg-accent-soft sm:aspect-auto sm:min-h-[360px]"
          >
            {featured.image && (
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </Link>
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              À la une
            </p>
            <Link href={`/articles/${featured.slug}`} className="group">
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-accent-deep sm:text-4xl">
                {featured.title}
              </h1>
            </Link>
            <p className="mt-4 leading-relaxed text-muted">{featured.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {formatDate(featured.date)}
              </span>
              {featured.tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="pill">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {tags.length > 0 && (
        <FadeUp>
          <section className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold">Explorer :</span>
            {tags.map(({ tag, count }) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="pill">
                {tag} <span className="ml-1 opacity-60">{count}</span>
              </Link>
            ))}
          </section>
        </FadeUp>
      )}

      <section>
        <FadeUp>
          <h2 className="mb-6 font-display text-2xl font-semibold">Dernières actualités</h2>
        </FadeUp>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article, i) => (
            <FadeUp key={article.slug} delay={Math.min(i * 0.06, 0.3)}>
              <ArticleCard article={article} />
            </FadeUp>
          ))}
        </div>
      </section>
    </div>
  );
}
