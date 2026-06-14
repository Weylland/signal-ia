"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type PageLink = { href: string; label: string };

type Props = {
  pages: PageLink[];
  labels: { menu: string; close: string; search: string; rss: string };
};

export function MobileMenu({ pages, labels }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le menu à chaque navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloque le scroll du body quand le menu est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.menu}
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px]"
      >
        <span className="block h-0.5 w-6 bg-[var(--ink)]" />
        <span className="block h-0.5 w-6 bg-[var(--ink)]" />
        <span className="block h-0.5 w-6 bg-[var(--ink)]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[var(--bg)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-2xl">
              signal<span className="text-[var(--accent)]">·</span>
              <span className="italic">ia</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="text-3xl leading-none"
            >
              ×
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-6">
            {pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3.5 font-display text-2xl transition-colors hover:text-[var(--accent)]"
              >
                {page.label}
              </Link>
            ))}
          </nav>

          <div className="flex gap-3 border-t border-line px-5 py-4">
            <Link href="/recherche" onClick={() => setOpen(false)} className="nb-btn flex-1">
              {labels.search}
            </Link>
            <a href="/flux.xml" className="nb-btn">
              {labels.rss}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
