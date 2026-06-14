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
  labels: { empty: string; remove: string; clear: string };
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

  function clearAll() {
    localStorage.setItem("bookmarks", "[]");
    setItems([]);
  }

  // Évite le flash avant l'hydratation
  if (items === null) return <div className="h-32" />;

  if (items.length === 0) {
    return <p className="nb-card max-w-md p-6 text-sm text-[var(--ink-dim)]">{labels.empty}</p>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="meta uppercase text-[var(--accent)]">
          {items.length} article{items.length > 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="meta uppercase text-[var(--ink-dim)] underline transition-colors hover:text-[var(--accent)]"
        >
          {labels.clear}
        </button>
      </div>
      <ul className="flex flex-col border-2 border-ink">
        {items.map((item) => (
          <li
            key={item.slug}
            className="flex items-center gap-4 border-b border-line bg-[var(--bg-raised)] px-5 py-4 last:border-b-0"
          >
            <span className="text-[var(--accent)]">★</span>
            <Link
              href={`/articles/${item.slug}`}
              className="flex-1 text-sm font-medium transition-colors hover:text-[var(--accent)]"
            >
              {item.title}
            </Link>
            <button
              type="button"
              onClick={() => remove(item.slug)}
              aria-label={labels.remove}
              title={labels.remove}
              className="meta shrink-0 uppercase text-[var(--ink-dim)] transition-colors hover:text-[var(--accent)]"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
