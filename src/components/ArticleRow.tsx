import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";
import { localizeMeta, readingTimeMinutes } from "@/lib/articles";
import type { Lang } from "@/lib/i18n";
import { CategoryBadge } from "./Tag";

export function ArticleRow({
  article,
  lang = "fr",
  rank,
}: {
  article: ArticleMeta;
  lang?: Lang;
  rank?: number;
}) {
  const loc = localizeMeta(article, lang);
  const locale = lang === "en" ? "en-GB" : "fr-FR";
  const time = new Date(article.date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const readMin = readingTimeMinutes(article.excerpt + " " + (loc.tldr.join(" ") ?? ""));
  const nS = article.sources.length;

  return (
    <Link href={`/articles/${article.slug}`} className="row-art flex gap-4 py-2.5">
      {rank != null && (
        <span className="w-[22px] shrink-0 pt-0.5 font-mono text-[15px] font-bold text-[var(--ac)]">
          {String(rank).padStart(2, "0")}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <CategoryBadge tags={article.tags} lang={lang} fallbackText={loc.title} />
          <span className="font-mono text-[10px] text-[var(--ink-f)]">{time}</span>
        </div>
        <div className="text-[14px] font-semibold leading-snug">{loc.title}</div>
        <div className="mt-0.5 font-mono text-[11px] text-[var(--ink-f)]">
          {readMin} min{nS > 0 ? ` · ${nS} source${nS > 1 ? "s" : ""}` : ""}
        </div>
      </div>
    </Link>
  );
}
