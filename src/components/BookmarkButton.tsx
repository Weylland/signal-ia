"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

type BookmarkItem = { slug: string; title: string };

function getBookmarks(): BookmarkItem[] {
  try {
    return JSON.parse(localStorage.getItem("bookmarks") ?? "[]") as BookmarkItem[];
  } catch {
    return [];
  }
}

export function BookmarkButton({ slug, title, lang }: { slug: string; title: string; lang?: Lang }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getBookmarks().some((b) => b.slug === slug));
  }, [slug]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = getBookmarks();
    const exists = current.some((b) => b.slug === slug);
    const next = exists ? current.filter((b) => b.slug !== slug) : [{ slug, title }, ...current];
    localStorage.setItem("bookmarks", JSON.stringify(next));
    setSaved(!exists);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? (lang === "en" ? "Remove bookmark" : "Retirer des favoris") : (lang === "en" ? "Bookmark" : "Sauvegarder")}
      className="meta shrink-0 transition-colors hover:text-[var(--accent)]"
      title={saved ? (lang === "en" ? "Remove bookmark" : "Retirer des favoris") : (lang === "en" ? "Add to bookmarks" : "Ajouter aux favoris")}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  useEffect(() => {
    setBookmarks(getBookmarks());
    const handler = () => setBookmarks(getBookmarks());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return bookmarks;
}
