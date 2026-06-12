import Image from "next/image";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";
import { formatDate } from "@/lib/articles";

const pillColors = ["var(--sunshine)", "var(--mint)", "var(--sky)", "var(--peach)"];

export function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link href={`/articles/${article.slug}`} className="nb-card flex h-full flex-col">
      <div className="relative aspect-[16/9] overflow-hidden border-b-[2.5px] border-ink bg-cream-2">
        {article.image ? (
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-sky font-display text-5xl font-bold">
            S
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-xs font-bold uppercase tracking-wider">
            {formatDate(article.date)}
          </span>
          {article.breaking && (
            <span className="nb-pill bg-[var(--peach)]">🔴 À chaud</span>
          )}
          {article.type === "tuto" && <span className="nb-pill bg-[var(--sky)]">🎓 Tuto</span>}
        </div>
        <h2 className="mt-2 font-display text-xl font-bold leading-snug">{article.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed">{article.excerpt}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {article.tags.slice(0, 3).map((tag, i) => (
            <span
              key={tag}
              className="nb-pill"
              style={{ background: pillColors[i % pillColors.length] }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
