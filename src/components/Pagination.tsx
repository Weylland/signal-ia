import Link from "next/link";
import type { Dict } from "@/lib/i18n";

export const PAGE_SIZE = 9;

export function paginate<T>(items: T[], page: number): { slice: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  return { slice: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), totalPages };
}

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  query,
  t,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string>;
  t: Dict;
}) {
  if (totalPages <= 1) return null;

  function href(p: number): string {
    const params = new URLSearchParams(query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="nb-btn text-xs">
          {t.pagePrev}
        </Link>
      ) : (
        <span />
      )}
      <span className="meta uppercase">{t.pageOf(page, totalPages)}</span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="nb-btn text-xs">
          {t.pageNext}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
