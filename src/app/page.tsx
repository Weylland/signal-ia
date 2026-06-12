import Image from "next/image";
import Link from "next/link";
import { getAllArticles, getAllTags, formatDate } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeIn, FadeUp } from "@/components/Reveal";

const pillColors = ["var(--sunshine)", "var(--mint)", "var(--sky)", "var(--peach)"];

export default async function Home() {
  const [articles, tags] = await Promise.all([getAllArticles(), getAllTags()]);

  if (articles.length === 0) {
    return <p className="text-sm">Aucun article publié pour l&apos;instant.</p>;
  }

  const [featured, ...rest] = articles;

  return (
    <div className="flex flex-col gap-14">
      <FadeIn>
        <section className="nb-card grid overflow-hidden sm:grid-cols-2" style={{ boxShadow: "var(--shadow-lg)" }}>
          <Link
            href={`/articles/${featured.slug}`}
            className="relative block aspect-[16/10] border-b-[2.5px] border-ink bg-cream-2 sm:aspect-auto sm:min-h-[380px] sm:border-b-0 sm:border-r-[2.5px]"
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
          <div className="flex flex-col justify-center bg-cream p-7 sm:p-10">
            <p className="mb-4">
              <span className="nb-pill bg-peach">★ À la une</span>
            </p>
            <Link href={`/articles/${featured.slug}`}>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                <span className="highlight">{featured.title}</span>
              </h1>
            </Link>
            <p className="mt-4 leading-relaxed">{featured.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                {formatDate(featured.date)}
              </span>
              {featured.tags.map((tag, i) => (
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
            <Link href={`/articles/${featured.slug}`} className="nb-btn nb-btn-primary mt-7 w-fit">
              Lire l&apos;article →
            </Link>
          </div>
        </section>
      </FadeIn>

      {tags.length > 0 && (
        <FadeUp>
          <section className="flex flex-wrap items-center gap-2">
            <span className="mr-2 font-display text-sm font-bold">Explorer :</span>
            {tags.map(({ tag, count }, i) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="nb-pill"
                style={{ background: pillColors[i % pillColors.length] }}
              >
                {tag} <span className="ml-1 opacity-70">{count}</span>
              </Link>
            ))}
          </section>
        </FadeUp>
      )}

      <section>
        <FadeUp>
          <h2 className="mb-6 font-display text-2xl font-bold">
            <span className="highlight-mint">Dernières actualités</span>
          </h2>
        </FadeUp>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
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
