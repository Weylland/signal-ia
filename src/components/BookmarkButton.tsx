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

  const label = saved
    ? (lang === "en" ? "Saved" : "Sauvegardé")
    : (lang === "en" ? "Save" : "Sauvegarder");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`meta flex shrink-0 items-center gap-1 transition-colors hover:text-[var(--accent)] ${saved ? "text-[var(--accent)]" : ""}`}
    >
      <span className="text-sm">{saved ? "★" : "☆"}</span>
      <span className="hidden sm:inline">{label}</span>
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
