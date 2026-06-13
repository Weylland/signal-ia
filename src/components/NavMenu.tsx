"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type NavLabels = {
  news: string;
  latest: string;
  allNews: string;
  week: string;
  trending: string;
  tutos: string;
  glossary: string;
};

export function NavMenu({ labels }: { labels: NavLabels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const items = [
    { href: "/", label: labels.latest },
    { href: "/actus", label: labels.allNews },
    { href: "/cette-semaine", label: labels.week },
    { href: "/trending", label: labels.trending },
  ];

  return (
    <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto sm:order-none sm:w-auto sm:gap-7">
      <div
        ref={ref}
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <span className="flex items-center">
          <Link href="/actus" className="mainnav-link">
            {labels.news}
          </Link>
          <button
            type="button"
            className="mainnav-link px-1"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={labels.news}
          >
            <span className="text-[10px] opacity-60">▾</span>
          </button>
        </span>
        {open && (
          // pt-2 fait le pont sous le bouton : pas de zone morte qui referme au survol
          <div className="absolute left-0 top-full z-50 pt-2">
            <div className="min-w-[190px] border-2 border-ink bg-[var(--bg)] shadow-[4px_4px_0_var(--ink)]">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link href="/tutos" className="mainnav-link">{labels.tutos}</Link>
      <Link href="/glossaire" className="mainnav-link">{labels.glossary}</Link>
    </nav>
  );
}
