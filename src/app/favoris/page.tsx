import type { Metadata } from "next";
import { getLang, getDict } from "@/lib/i18n";
import { FadeUp } from "@/components/Reveal";
import { FavorisList } from "@/components/FavorisList";

export const metadata: Metadata = {
  title: "Mes favoris",
  description: "Les articles que vous avez sauvegardés sur signal·ia.",
  robots: { index: false },
};

export default async function FavorisPage() {
  const lang = await getLang();
  const t = getDict(lang);

  return (
    <div className="mx-auto max-w-2xl">
      <FadeUp>
        <header className="mb-8">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.favoritesTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.favoritesIntro}</p>
        </header>
      </FadeUp>
      <FadeUp delay={0.05}>
        <FavorisList
          labels={{
            empty: t.favoritesEmpty,
            remove: t.favoritesRemove,
            clear: t.favoritesClear,
          }}
        />
      </FadeUp>
    </div>
  );
}
