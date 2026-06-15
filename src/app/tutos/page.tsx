import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, localizeMeta, readingTimeMinutes } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { Tag } from "@/components/Tag";
import { PageHeader, PageBand } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutos IA",
  description:
    "Tutoriels pratiques pour utiliser l'IA au quotidien : prompts, MCP, agents, outils. En français, sans jargon inutile.",
};

export default async function TutosPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";
  const locale = en ? "en-GB" : "fr-FR";
  const tutos = await getAllArticles({ type: "tuto" });

  return (
    <div className="-mt-10">
      <PageHeader
        title={en ? "Practical tutorials" : "Tutoriels pratiques"}
        subtitle={en ? "Hand-written guides. Code that actually runs." : "Guides écrits à la main. Du code qui tourne vraiment."}
      />
      <PageBand>
        {tutos.length === 0 ? (
          <div className="flex flex-col gap-6">
            <p className="font-serif text-[15px] text-[var(--ink-d)]">
              {t.tutosEmpty}{" "}
              <Link href="/" className="text-[var(--ac)] underline">
                {t.homePage}
              </Link>
              .
            </p>
            <div className="border border-dashed border-line p-6" style={{ background: "var(--bg-r)" }}>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ac)]">
                {en ? "Coming soon" : "À venir"}
              </p>
              <ul className="flex flex-col gap-2 font-serif text-sm text-[var(--ink-d)]">
                <li>→ {en ? "Write better prompts in 10 rules" : "Écrire de meilleurs prompts en 10 règles"}</li>
                <li>→ {en ? "Set up Claude with MCP in 5 minutes" : "Configurer Claude avec MCP en 5 minutes"}</li>
                <li>→ {en ? "Automate your AI watch with n8n" : "Automatiser sa veille IA avec n8n"}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {tutos.map((tuto, i) => {
              const loc = localizeMeta(tuto, lang);
              const readMin = readingTimeMinutes(tuto.excerpt + " " + (loc.tldr.join(" ") ?? ""));
              const date = new Date(tuto.date).toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return (
                <Link
                  key={tuto.slug}
                  href={`/articles/${tuto.slug}`}
                  className="card-mag group grid items-start gap-5 p-6 [grid-template-columns:80px_1fr_auto] max-sm:[grid-template-columns:1fr]"
                >
                  <div className="text-center max-sm:text-left">
                    <div className="font-mono text-[28px] font-bold leading-none text-[var(--ac)]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-[var(--ink-f)]">{readMin} min</div>
                  </div>
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ac)]" style={{ border: "1px solid currentColor", padding: "2px 6px" }}>
                        {t.guide}
                      </span>
                      {tuto.tags.slice(0, 3).map((tg) => (
                        <Tag key={tg}>{tg}</Tag>
                      ))}
                    </div>
                    <h2 className="mb-3 text-[18px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-[var(--ac)]">
                      {loc.title}
                    </h2>
                    <p className="font-serif text-[14px] leading-relaxed text-[var(--ink-d)]">{loc.excerpt}</p>
                    <div className="mt-3 font-mono text-[11px] text-[var(--ink-f)]">{date}</div>
                  </div>
                  <div className="whitespace-nowrap pt-1 font-mono text-[12px] text-[var(--ac)] max-sm:hidden">
                    {en ? "Read →" : "Lire →"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PageBand>
    </div>
  );
}
