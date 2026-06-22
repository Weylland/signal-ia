"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

type PageLink = { href: string; label: string; icon?: string };

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

  // Ouverture : Cmd/Ctrl+K, bouton (événement), fermeture : Échap
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-cmdk", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-cmdk", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      // Réinitialise la recherche à chaque ouverture de la palette.
      /* eslint-disable react-hooks/set-state-in-effect */
      setQuery("");
      setActive(0);
      /* eslint-enable react-hooks/set-state-in-effect */
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const filteredPages = useMemo(
    () => (q ? pages.filter((p) => p.label.toLowerCase().includes(q)) : pages),
    [q, pages]
  );

  const searchAction = q
    ? {
        href: `/recherche?q=${encodeURIComponent(query.trim())}`,
        label: `${searchLabel} ${lang === "en" ? `"${query.trim()}"` : `« ${query.trim()} »`}`,
        icon: "⌕" as string | undefined,
      }
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
    <div className="cmd-bg" onClick={() => setOpen(false)}>
      <div className="cmd-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg width="14" height="14" fill="none" className="shrink-0 text-[var(--ink-f)]" aria-hidden="true">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-4 font-display text-[15px] outline-none placeholder:text-[var(--ink-f)]"
          />
          <span className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-f)]">
            ESC
          </span>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {!q && (
            <p className="px-4 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
              {pagesLabel}
            </p>
          )}
          {items.length === 0 && (
            <p className="px-4 py-7 text-center text-sm text-[var(--ink-f)]">—</p>
          )}
          {items.map((item, i) => (
            <button
              key={item.href + i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item.href)}
              className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
              style={{
                background: i === active ? "var(--bg-r)" : "none",
                borderLeft: i === active ? "2px solid var(--ac)" : "2px solid transparent",
              }}
            >
              {"icon" in item && item.icon ? (
                <span
                  className="shrink-0 font-mono text-[12px]"
                  style={{ color: "var(--ac)", width: 20, textAlign: "center" }}
                >
                  {item.icon}
                </span>
              ) : null}
              <span className="flex-1 font-display text-[14px]">{item.label}</span>
              {i === active && (
                <span className="ml-auto font-mono text-[10px] text-[var(--ink-f)]">↵</span>
              )}
            </button>
          ))}
        </div>
        <div
          className="flex gap-5 border-t border-line px-4 py-1.5 font-mono text-[10px] text-[var(--ink-f)]"
        >
          <span>↑↓ naviguer</span>
          <span>↵ ouvrir</span>
          <span>ESC fermer</span>
        </div>
      </div>
    </div>
  );
}
