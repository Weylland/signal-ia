import type { Metadata } from "next";
import { getSources } from "@/lib/sources";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nos sources",
  description:
    "La liste des médias et blogs spécialisés que signal·ia surveille en continu pour produire sa veille IA.",
};

export default async function SourcesPage() {
  const sources = getSources({ activeOnly: true });

  return (
    <div className="mx-auto max-w-3xl">
      <FadeUp>
        <header className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            <span className="highlight">Nos sources</span>
          </h1>
          <p className="mt-4 leading-relaxed">
            signal·ia surveille en continu une sélection de médias et blogs spécialisés reconnus.
            Chaque article cite ses sources — tu peux toujours remonter à l&apos;information
            d&apos;origine.
          </p>
        </header>
      </FadeUp>

      <div className="grid gap-4 sm:grid-cols-2">
        {sources.map((source, i) => (
          <FadeUp key={source.id} delay={Math.min(i * 0.04, 0.25)}>
            <div className="nb-card p-5">
              <p className="font-display font-bold">{source.name}</p>
              <p className="mt-1 truncate text-xs text-ink/50">
                {new URL(source.url).hostname.replace(/^www\./, "")}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}
