import Link from "next/link";
import { getLang, getDict } from "@/lib/i18n";
import { CoverPattern } from "@/components/CoverPattern";

export default async function NotFound() {
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center">
      <div className="mb-8 w-full max-w-md overflow-hidden border-2 border-ink shadow-[5px_5px_0_var(--ink)]">
        <div className="aspect-[16/9]">
          <CoverPattern seed="404-not-found" label="404" />
        </div>
      </div>
      <p className="meta uppercase text-[var(--accent)]">404</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {en ? "Page not found" : "Page introuvable"}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-[var(--ink-dim)]">
        {en
          ? "This page doesn't exist or has moved. The news is still here, though."
          : "Cette page n'existe pas ou a été déplacée. L'actu, elle, est toujours là."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="nb-btn nb-btn-primary">
          {t.home}
        </Link>
        <Link href="/recherche" className="nb-btn">
          {t.searchTitle}
        </Link>
        <Link href="/actus" className="nb-btn">
          {t.navAllNews}
        </Link>
      </div>
    </div>
  );
}
