import { categoryFor } from "@/lib/category";
import type { Lang } from "@/lib/i18n";

/** Badge de catégorie coloré, déduit des tags. */
export function CategoryBadge({
  tags,
  lang = "fr",
  fallbackText = "",
}: {
  tags: string[];
  lang?: Lang;
  fallbackText?: string;
}) {
  const cat = categoryFor(tags, lang, fallbackText);
  return <span className={`tag${cat.cls ? " " + cat.cls : ""}`}>{cat.label}</span>;
}

/** Tag simple (texte). */
export function Tag({ children, href }: { children: React.ReactNode; href?: string }) {
  if (href) {
    return (
      <a href={href} className="tag">
        {children}
      </a>
    );
  }
  return <span className="tag">{children}</span>;
}
