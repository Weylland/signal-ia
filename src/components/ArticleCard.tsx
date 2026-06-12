import Image from "next/image";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";

export function ArticleCard({ article }: { article: ArticleMeta }) {
  const date = new Date(article.date);
  const dateLabel = `${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <article className="nb-card-hover flex h-full flex-col gap-3.5 bg-transparent p-5">
      {article.image && (
        <Link
          href={`/articles/${article.slug}`}
          className="relative block aspect-[16/9] overflow-hidden border border-line"
        >
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {article.breaking && <span className="nb-pill tag--hot">À chaud</span>}
        {article.type === "tuto" && <span className="nb-pill tag--hot">Tuto</span>}
        {article.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="nb-pill">
            {tag}
          </span>
        ))}
        <span className="meta uppercase">{dateLabel}</span>
      </div>
      <h3 className="font-display text-2xl leading-tight text-balance">
        <Link href={`/articles/${article.slug}`} className="transition-colors hover:text-[var(--accent)]">
          {article.title}
        </Link>
      </h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-[var(--ink-dim)]">
        {article.excerpt}
      </p>
      <div className="meta mt-auto pt-1 uppercase">
        {article.sources.length > 0 && `${article.sources.length} source${article.sources.length > 1 ? "s" : ""}`}
      </div>
    </article>
  );
}
