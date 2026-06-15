"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BookmarkItem = { slug: string; title: string };

function getBookmarks(): BookmarkItem[] {
  try {
    return JSON.parse(localStorage.getItem("bookmarks") ?? "[]") as BookmarkItem[];
  } catch {
    return [];
  }
}

type Props = {
  labels: { empty: string; emptyTitle: string; remove: string; explore: string; count: (n: number) => string };
};

export function FavorisList({ labels }: Props) {
  const [items, setItems] = useState<BookmarkItem[] | null>(null);

  useEffect(() => {
    setItems(getBookmarks());
  }, []);

  function remove(slug: string) {
    const next = getBookmarks().filter((b) => b.slug !== slug);
    localStorage.setItem("bookmarks", JSON.stringify(next));
    setItems(next);
  }

  if (items === null) return <div className="h-32" />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="font-mono text-[48px] text-[var(--ln-h)]">♡</span>
        <h2 className="text-[20px] font-semibold text-[var(--ink-d)]">{labels.emptyTitle}</h2>
        <p className="max-w-[320px] font-serif text-[15px] leading-relaxed text-[var(--ink-f)]">
          {labels.empty}
        </p>
        <Link href="/actus" className="btn btn-p mt-3">
          {labels.explore}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 font-mono text-[11px] uppercase text-[var(--ac)]">{labels.count(items.length)}</p>
      <div>
        {items.map((item) => (
          <div key={item.slug} className="flex items-center gap-4 border-b border-line py-4">
            <span className="text-[var(--ac)]">★</span>
            <Link
              href={`/articles/${item.slug}`}
              className="flex-1 text-[14px] font-semibold leading-snug transition-colors hover:text-[var(--ac)]"
            >
              {item.title}
            </Link>
            <button
              type="button"
              onClick={() => remove(item.slug)}
              className="btn btn-sm btn-g shrink-0 text-[var(--ink-f)]"
            >
              × {labels.remove}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
