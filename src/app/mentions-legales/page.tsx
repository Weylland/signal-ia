import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold">Mentions légales</h1>
      <div className="prose-article mt-8">
        <h2>Éditeur du site</h2>
        <p>
          Nicolas Samier — entrepreneur individuel
          <br />
          Contact : <a href="mailto:gardanor@gmail.com">gardanor@gmail.com</a>
        </p>

        <h2>Directeur de la publication</h2>
        <p>Nicolas Samier</p>

        <h2>Hébergement</h2>
        <p>
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
          <br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les contenus éditoriaux publiés sur ce site sont la propriété de l&apos;éditeur. Les
          images d&apos;illustration proviennent des sources citées sur chaque article et restent
          la propriété de leurs ayants droit respectifs.
        </p>

        <h2>Production éditoriale</h2>
        <p>
          Les articles sont produits avec l&apos;assistance d&apos;outils de rédaction
          automatisés, à partir de sources publiques citées sur chaque article, sous le contrôle
          éditorial de l&apos;éditeur.
        </p>

        <h2>Responsabilité</h2>
        <p>
          L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude des informations
          publiées, qui s&apos;appuient sur les sources citées. Il ne saurait être tenu
          responsable des erreurs ou omissions, ni de l&apos;usage fait des informations publiées.
          Les liens externes sont fournis à titre informatif ; leur contenu n&apos;engage que
          leurs éditeurs respectifs.
        </p>
      </div>
    </div>
  );
}
