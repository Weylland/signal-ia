import type { Metadata } from "next";
import { getLang, getDict } from "@/lib/i18n";
import { FavorisList } from "@/components/FavorisList";
import { PageHeader, PageBand } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Mes favoris",
  description: "Les articles que vous avez sauvegardés sur signal·ia.",
  robots: { index: false },
};

export default async function FavorisPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";

  return (
    <div className="-mt-10">
      <PageHeader title={t.favoritesTitle} subtitle={t.favoritesIntro} />
      <PageBand>
        <FavorisList
          labels={{
            emptyTitle: en ? "No favorites yet" : "Aucun favori pour l'instant",
            empty: en
              ? 'Tap "Save" on any article to find it back here.'
              : "Cliquez sur Sauvegarder dans n'importe quel article pour le retrouver ici.",
            remove: en ? "Remove" : "Retirer",
            explore: en ? "Explore news" : "Explorer les actus",
            lang: en ? "en" : "fr",
          }}
        />
      </PageBand>
    </div>
  );
}
