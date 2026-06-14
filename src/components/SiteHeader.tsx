"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

type NavLink = { href: string; label: string };

type Props = {
  links: NavLink[];
  lang: Lang;
  labels: { search: string; favorites: string; menu: string; close: string };
};

function openCmdk() {
  window.dispatchEvent(new CustomEvent("open-cmdk"));
}

export function SiteHeader({ links, lang, labels }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mob, setMob] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    setMob(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mob ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mob]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  function setLang(next: Lang) {
    if (next === lang) return;
    document.cookie = `lang=${next}; path=/; max-age=${365 * 24 * 3600}; samesite=lax`;
    router.refresh();
  }

  const Logo = (
    <span className="font-display text-[19px] tracking-tight">
      <span className="text-[var(--ac)]">signal</span>
      <span className="text-[var(--ink-f)]">·</span>
      <span>ia</span>
    </span>
  );

  return (
    <>
      <header
        className="has-scanlines sticky top-0 z-[100] border-b border-line"
        style={{ background: "var(--bg-d)", backdropFilter: "blur(8px)" }}
      >
        <nav className="mx-auto flex h-[52px] max-w-[1200px] items-center gap-3 px-6">
          <Link href="/" className="flex shrink-0 items-center" aria-label="signal·ia">
            {Logo}
          </Link>

          <div className="hm flex flex-1 items-center overflow-hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex h-[52px] items-center whitespace-nowrap px-[9px] text-[13px] font-medium transition-colors"
                style={{
                  color: isActive(l.href) ? "var(--ac)" : "var(--ink-d)",
                  borderBottom: isActive(l.href)
                    ? "2px solid var(--ac)"
                    : "2px solid transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              onClick={openCmdk}
              className="hm flex h-8 items-center gap-1.5 border border-line px-2.5 font-mono text-[11px] text-[var(--ink-f)]"
              style={{ background: "var(--bg-r)" }}
              aria-label={labels.search}
            >
              <SearchIcon />⌘K
            </button>
            <button
              onClick={openCmdk}
              className="btn btn-g hd flex h-11 w-11 items-center justify-center !p-0"
              aria-label={labels.search}
            >
              <SearchIcon />
            </button>
            <Link
              href="/favoris"
              className="btn btn-g flex h-11 w-11 items-center justify-center !p-0 text-lg"
              aria-label={labels.favorites}
            >
              ★
            </Link>
            <button
              onClick={toggleTheme}
              className="btn btn-g flex h-11 w-11 items-center justify-center !p-0 text-[15px]"
              aria-label="Thème"
            >
              {theme === "dark" ? "○" : "●"}
            </button>
            <span className="hm flex items-center gap-1.5 px-1 font-mono text-[11px] text-[var(--ink-f)]">
              <button
                onClick={() => setLang("fr")}
                className={lang === "fr" ? "text-[var(--ac)]" : ""}
              >
                FR
              </button>
              <span className="opacity-40">/</span>
              <button
                onClick={() => setLang("en")}
                className={lang === "en" ? "text-[var(--ac)]" : ""}
              >
                EN
              </button>
            </span>
            <button
              onClick={() => setMob(true)}
              className="hd flex h-11 w-11 items-center justify-center text-[22px]"
              aria-label={labels.menu}
            >
              ≡
            </button>
          </div>
        </nav>
      </header>

      {/* Drawer mobile */}
      <div className={`mob-nav${mob ? " open" : ""}`}>
        <div className="mb-12 flex items-center justify-between">
          {Logo}
          <button
            onClick={() => setMob(false)}
            className="flex h-11 w-11 items-center justify-center text-2xl"
            aria-label={labels.close}
          >
            ×
          </button>
        </div>
        {[{ href: "/", label: lang === "en" ? "Home" : "Accueil" }, ...links].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMob(false)}
            className="block min-h-[56px] border-b border-line py-3 text-[22px] font-semibold"
            style={{ color: isActive(l.href) ? "var(--ac)" : "var(--ink)" }}
          >
            {l.label}
          </Link>
        ))}
        <div className="mt-auto flex gap-3 pt-6">
          <button onClick={toggleTheme} className="btn flex-1" style={{ minHeight: 48 }}>
            {theme === "dark" ? (lang === "en" ? "Light theme" : "Thème clair") : lang === "en" ? "Dark theme" : "Thème sombre"}
          </button>
          <button
            onClick={() => {
              setMob(false);
              openCmdk();
            }}
            className="btn flex-1"
            style={{ minHeight: 48 }}
          >
            ⌘ {labels.search}
          </button>
        </div>
      </div>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}
