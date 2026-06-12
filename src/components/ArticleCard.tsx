import Image from "next/image";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";
import { formatDate } from "@/lib/articles";

export function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <article className="card group flex h-full flex-col">
      <Link href={`/articles/${article.slug}`} className="flex h-full flex-col">
        <div className="card-image relative aspect-[16/9] overflow-hidden bg-accent-soft">
          {article.image ? (
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-accent">
              ·
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {formatDate(article.date)}
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold leading-snug transition-colors group-hover:text-accent-deep">
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
