import type { Metadata } from "next";
import Link from "next/link";
import { getSources } from "@/lib/sources";
import { categoryFor } from "@/lib/category";
import { getLang, getDict } from "@/lib/i18n";
import { PageHeader, PageBand } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nos sources",
  description:
    "La liste des médias et blogs spécialisés que signal·ia surveille en continu pour produire sa veille IA.",
};

type SourceRow = {
  id: number;
  name: string;
  url: string;
  last_fetch_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
  article_count?: number | null;
};

function health(s: SourceRow): { cls: string; color: string; label: string; labelEn: string } {
  if (s.last_error) return { cls: "s-err", color: "var(--er)", label: "Erreur", labelEn: "Error" };
  if (!s.last_fetch_at) return { cls: "s-wn", color: "var(--wn)", label: "En attente", labelEn: "Pending" };
  return { cls: "s-ok", color: "var(--ok)", label: "Opérationnel", labelEn: "Operational" };
}

export default async function SourcesPage() {
  const sources = getSources({ activeOnly: true }) as SourceRow[];
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";
  const locale = en ? "en-GB" : "fr-FR";

  return (
    <div className="-mt-10">
      <PageHeader
        title={t.sourcesTitle}
        subtitle={
          en
            ? `The ${sources.length} RSS feeds we follow. No opaque selection.`
            : `Les ${sources.length} flux RSS que nous suivons. Aucune sélection opaque.`
        }
      />
      <PageBand>
        <div className="mag mb-12">
          {sources.map((s) => {
            const cat = categoryFor([s.name], lang, s.name);
            const h = health(s);
            const last = s.last_fetch_at
              ? new Date(s.last_fetch_at).toLocaleDateString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
              : "—";
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 border border-line p-5"
                style={{ background: "var(--bg-r)" }}
              >
                <div className="flex items-start justify-between">
                  <span className={`tag${cat.cls ? " " + cat.cls : ""}`}>{cat.label}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: h.color }}>
                    <span className={h.cls} />
                    {en ? h.labelEn : h.label}
                  </span>
                </div>
                <div className="text-[16px] font-semibold">{s.name}</div>
                <div className="flex justify-between font-mono text-[11px] text-[var(--ink-f)]">
                  <span>{en ? "Last sync" : "Synchro"} : {last}</span>
                  {s.article_count != null && (
                    <span className="text-[var(--ac)]">
                      {s.article_count} {en ? "articles" : "articles"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="border border-line p-5 font-serif text-[15px] leading-relaxed text-[var(--ink-d)]"
          style={{ background: "var(--bg-d)" }}
        >
          {en ? "Know a quality source we're missing? " : "Vous connaissez une source de qualité que nous manquons ? "}
          <Link href="/contact" className="text-[var(--ac)] underline" style={{ textUnderlineOffset: 3 }}>
            {en ? "Suggest it via the contact form." : "Suggérez-la via le formulaire de contact."}
          </Link>
        </div>
      </PageBand>
    </div>
  );
}
