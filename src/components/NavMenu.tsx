"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { Dict, Lang } from "@/lib/i18n";

export function NavMenu({ t, lang }: { t: Dict; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto sm:order-none sm:w-auto sm:gap-7">
      {/* Actu avec dropdown */}
      <div
        ref={ref}
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          className="mainnav-link flex items-center gap-0.5"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {t.navNews}
          <span className="text-[10px] opacity-60">▾</span>
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] border-2 border-ink bg-[var(--bg)] shadow-[4px_4px_0_var(--ink)]">
            <Link
              href="/"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {lang === "en" ? "Latest" : "Dernières actus"}
            </Link>
            <Link
              href="/actus"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {t.navAllNews}
            </Link>
            <Link
              href="/cette-semaine"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {t.navWeek}
            </Link>
            <Link
              href="/trending"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {t.navTrending}
            </Link>
          </div>
        )}
      </div>

      <Link href="/tutos" className="mainnav-link">{t.navTutos}</Link>
      <Link href="/glossaire" className="mainnav-link">{t.navGlossary}</Link>
      <Link href="/recherche" className="mainnav-link">{t.navSearch}</Link>
    </nav>
  );
}
