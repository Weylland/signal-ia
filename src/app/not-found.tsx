import Link from "next/link";
import { getLang, getDict } from "@/lib/i18n";

export default async function NotFound() {
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-24 text-center">
      <div className="mb-4 font-mono text-[96px] font-bold leading-none tracking-[-0.04em] text-[var(--ln-h)]">
        404
      </div>
      <h1 className="mb-4 text-[28px] font-bold tracking-[-0.02em]">
        {en ? "Page not found" : "Page introuvable"}
      </h1>
      <p className="mb-8 max-w-[380px] font-serif text-[16px] leading-relaxed text-[var(--ink-d)]">
        {en
          ? "This page doesn't exist or has moved. Use the navigation or search to find what you're looking for."
          : "Cette page n'existe pas ou a été déplacée. Utilisez la navigation ou la recherche pour trouver ce que vous cherchez."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-p btn-lg">
          ← {t.home}
        </Link>
        <Link href="/actus" className="btn btn-lg">
          {t.navAllNews}
        </Link>
      </div>
    </div>
  );
}
