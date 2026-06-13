"use client";

import { useState } from "react";
import Link from "next/link";

type NavLabels = {
  news: string;
  latest: string;
  allNews: string;
  week: string;
  trending: string;
  tutos: string;
  glossary: string;
  search: string;
};

export function NavMenu({ labels }: { labels: NavLabels }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto sm:order-none sm:w-auto sm:gap-7">
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          className="mainnav-link flex items-center gap-0.5"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {labels.news}
          <span className="text-[10px] opacity-60">▾</span>
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] border-2 border-ink bg-[var(--bg)] shadow-[4px_4px_0_var(--ink)]">
            <Link
              href="/"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {labels.latest}
            </Link>
            <Link
              href="/actus"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {labels.allNews}
            </Link>
            <Link
              href="/cette-semaine"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {labels.week}
            </Link>
            <Link
              href="/trending"
              className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
              onClick={() => setOpen(false)}
            >
              {labels.trending}
            </Link>
          </div>
        )}
      </div>

      <Link href="/tutos" className="mainnav-link">{labels.tutos}</Link>
      <Link href="/glossaire" className="mainnav-link">{labels.glossary}</Link>
      <Link href="/recherche" className="mainnav-link">{labels.search}</Link>
    </nav>
  );
}
