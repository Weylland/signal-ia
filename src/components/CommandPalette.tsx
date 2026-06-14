"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

type PageLink = { href: string; label: string };

type Props = {
  pages: PageLink[];
  lang: Lang;
  placeholder: string;
  pagesLabel: string;
  searchLabel: string;
};

export function CommandPalette({ pages, lang, placeholder, pagesLabel, searchLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Ouverture/fermeture au clavier (Cmd/Ctrl+K, Échap)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const filteredPages = useMemo(
    () => (q ? pages.filter((p) => p.label.toLowerCase().includes(q)) : pages),
    [q, pages]
  );

  const searchAction = q
    ? { href: `/recherche?q=${encodeURIComponent(query.trim())}`, label: `${searchLabel} ${lang === "en" ? `"${query.trim()}"` : `« ${query.trim()} »`}` }
    : null;

  const items = [...filteredPages, ...(searchAction ? [searchAction] : [])];

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) go(item.href);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg border-2 border-ink bg-[var(--bg)] shadow-[6px_6px_0_var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onInputKey}
          placeholder={placeholder}
          className="w-full border-b-2 border-ink bg-transparent px-4 py-3.5 text-base outline-none placeholder:text-[var(--ink-faint)]"
        />
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filteredPages.length > 0 && (
            <p className="meta px-4 py-1.5 uppercase text-[var(--ink-faint)]">{pagesLabel}</p>
          )}
          {items.map((item, i) => (
            <button
              key={item.href + i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item.href)}
              className={`block w-full px-4 py-2.5 text-left text-sm font-medium ${
                i === active ? "bg-[var(--accent)] text-[var(--on-accent)]" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
          {items.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--ink-dim)]">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
