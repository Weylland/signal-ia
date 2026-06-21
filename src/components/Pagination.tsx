import Link from "next/link";

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

// Fenêtre de pages : 1 … (cur-1) cur (cur+1) … total — jamais 1000 boutons.
export function pageWindow(current: number, total: number, delta = 1): (number | "…")[] {
  const out: (number | "…")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  out.push(1);
  if (left > 2) out.push("…");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("…");
  if (total > 1) out.push(total);
  return out;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;
  const cur = Math.min(Math.max(1, page), totalPages);

  function href(p: number): string {
    const params = new URLSearchParams(query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Pagination">
      {cur > 1 && (
        <Link href={href(cur - 1)} className="btn btn-sm" aria-label="Page précédente">←</Link>
      )}
      {pageWindow(cur, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="flex min-w-7 items-center justify-center font-mono text-[12px] text-[var(--ink-f)]">…</span>
        ) : (
          <Link key={p} href={href(p)} className={`btn btn-sm${p === cur ? " btn-p" : ""}`} aria-current={p === cur ? "page" : undefined}>
            {p}
          </Link>
        )
      )}
      {cur < totalPages && (
        <Link href={href(cur + 1)} className="btn btn-sm" aria-label="Page suivante">→</Link>
      )}
    </nav>
  );
}
