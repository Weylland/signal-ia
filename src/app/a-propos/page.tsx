import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "signal·ia couvre chaque jour l'essentiel de l'actualité de l'intelligence artificielle et de la robotique.",
};

export default function AProposPage() {
  return (
    <FadeIn>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">À propos</h1>
        <div className="prose-article mt-8">
          <p>
            signal·ia suit au quotidien ce qui compte dans l&apos;intelligence artificielle et la
            robotique : nouveaux modèles, agents, financements, recherche, régulation.
          </p>
          <p>
            Le principe est simple : chaque matin, une sélection resserrée des actualités
            réellement importantes — pas un flux infini. Chaque article cite ses sources, que vous
            pouvez consulter pour approfondir.
          </p>
          <p>
            Le site est volontairement léger : pas de publicité, pas de traceurs, pas de compte à
            créer. Vous pouvez suivre les publications via le{" "}
            <a href="/flux.xml">flux RSS</a>.
          </p>
          <p>
            Une question, une remarque, un sujet à signaler ?{" "}
            <a href="mailto:gardanor@gmail.com">Écrivez-nous</a>.
          </p>
        </div>
        <Link
          href="/"
          className="btn btn-primary mt-10"
        >
          Voir les actualités
        </Link>
      </div>
    </FadeIn>
  );
}
