import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, localizeMeta, type Difficulty } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { Tag } from "@/components/Tag";
import { PageHeader, PageBand } from "@/components/PageShell";
import { TutosFilter } from "@/components/TutosFilter";
import { Pagination, paginate, parsePage } from "@/components/Pagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutos IA",
  description:
    "Tutoriels pratiques pour utiliser l'IA au quotidien : prompts, MCP, agents, outils. En français, sans jargon inutile.",
};

const DIFFICULTIES: { value: Difficulty; labelFr: string; labelEn: string }[] = [
  { value: "debutant", labelFr: "débutant", labelEn: "beginner" },
  { value: "intermediaire", labelFr: "intermédiaire", labelEn: "intermediate" },
  { value: "avance", labelFr: "avancé", labelEn: "advanced" },
];

export default async function TutosPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string; page?: string }>;
}) {
  const params = await searchParams;
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";
  const locale = en ? "en-GB" : "fr-FR";

  const difficulty = DIFFICULTIES.find((d) => d.value === params.difficulty)?.value;
  const page = parsePage(params.page);
  const allTutos = await getAllArticles({ type: "tuto", difficulty });
  const { slice: tutos, totalPages } = paginate(allTutos, page);
  const offset = (Math.min(page, totalPages) - 1) * 9;

  return (
    <div className="-mt-10">
      <PageHeader
        title={en ? "Practical tutorials" : "Tutoriels pratiques"}
        subtitle={en ? "Practical guides. Code that actually runs." : "Guides pratiques. Du code qui tourne vraiment."}
      />
      <PageBand>
        {/* Filtres niveau */}
        <TutosFilter
          current={difficulty ?? null}
          difficulties={DIFFICULTIES.map((d) => ({ value: d.value, label: en ? d.labelEn : d.labelFr }))}
          allLabel={en ? "All levels" : "Tous niveaux"}
        />

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
              const readMin = tuto.readingMinutes;
              const date = new Date(tuto.date).toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const diff = DIFFICULTIES.find((d) => d.value === tuto.difficulty);
              return (
                <Link
                  key={tuto.slug}
                  href={`/articles/${tuto.slug}`}
                  className="card-mag group grid items-start gap-5 p-6 [grid-template-columns:80px_1fr_auto] max-sm:[grid-template-columns:1fr]"
                >
                  <div className="text-center max-sm:text-left">
                    <div className="font-mono text-[28px] font-bold leading-none text-[var(--ac)]">
                      {String(offset + i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-[var(--ink-f)]">{readMin} min</div>
                  </div>
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ac)]" style={{ border: "1px solid currentColor", padding: "2px 6px" }}>
                        {t.guide}
                      </span>
                      {diff && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--ink-f)]" style={{ border: "1px solid var(--ln)", padding: "2px 6px" }}>
                          {en ? diff.labelEn : diff.labelFr}
                        </span>
                      )}
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

        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/tutos"
          query={difficulty ? { difficulty } : undefined}
        />
      </PageBand>
    </div>
  );
}
