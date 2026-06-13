import type { Metadata } from "next";
import { getSources } from "@/lib/sources";
import { getLang, getDict } from "@/lib/i18n";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nos sources",
  description:
    "La liste des médias et blogs spécialisés que signal·ia surveille en continu pour produire sa veille IA.",
};

export default async function SourcesPage() {
  const sources = getSources({ activeOnly: true });
  const lang = await getLang();
  const t = getDict(lang);

  return (
    <div className="mx-auto max-w-3xl">
      <FadeUp>
        <header className="mb-10">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.sourcesTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.sourcesIntro}</p>
          <p className="meta mt-3 uppercase text-[var(--accent)]">
            {t.sourcesActive(sources.length)}
          </p>
        </header>
      </FadeUp>

      <div className="grid gap-4 sm:grid-cols-2">
        {sources.map((source, i) => (
          <FadeUp key={source.id} delay={Math.min(i * 0.04, 0.25)} className="h-full">
            <div className="nb-card h-full p-5">
              <p className="font-display text-lg">{source.name}</p>
              <p className="meta mt-1 truncate">
                {new URL(source.url).hostname.replace(/^www\./, "")}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}
