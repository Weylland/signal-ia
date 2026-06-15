import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { PageHeader, PageBand } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "signal·ia couvre chaque jour l'essentiel de l'actualité de l'intelligence artificielle et de la robotique. Sélection resserrée, sources citées, zéro bruit.",
};

export default async function AProposPage() {
  const lang = await getLang();
  const en = lang === "en";

  return (
    <div className="-mt-10">
      <PageHeader
        narrow
        kicker={en ? "Editorial" : "Éditorial"}
        title={
          en ? (
            <>
              The essential of AI,
              <br />
              sorted, no noise.
            </>
          ) : (
            <>
              L&apos;essentiel de l&apos;IA,
              <br />
              trié, sans bruit.
            </>
          )
        }
        subtitle={
          en
            ? "signal·ia is an independent watch media, no ads, no trackers. Our promise: give you what matters, without the rest."
            : "signal·ia est un média de veille indépendant, sans publicité, sans traceurs. Notre promesse : vous donner ce qui compte, sans le reste."
        }
      />
      <PageBand narrow>
        <div className="prose">
          <h2>{en ? "Why signal·ia" : "Pourquoi signal·ia"}</h2>
          <p>
            {en
              ? "The noise in the AI ecosystem has become unbearable. Every day, dozens of announcements, benchmarks, controversies. Most of it has no concrete importance for those who build or want to understand."
              : "Le bruit dans l'écosystème IA est devenu insupportable. Chaque jour, des dizaines d'annonces, de benchmarks, de controverses. La majorité n'a aucune importance concrète pour ceux qui construisent ou qui veulent comprendre."}
          </p>
          <p>
            {en
              ? "signal·ia exists to filter that noise. Every published article answers a simple question: does it change anything for a developer or a serious enthusiast? If not, we don't publish it."
              : "signal·ia existe pour filtrer ce bruit. Chaque article publié répond à une question simple : est-ce que ça change quelque chose pour un développeur ou un curieux sérieux ? Si non, on ne le publie pas."}
          </p>
          <h2>{en ? "How it works" : "Notre fonctionnement"}</h2>
          <p>
            {en
              ? "News is collected automatically via an RSS pipeline, summarized by a language model, then reviewed and validated manually before publishing. Every article cites its sources."
              : "Les actus sont collectées automatiquement via un pipeline de sources RSS, résumées par un modèle de langage, puis relues et validées manuellement avant publication. Chaque article cite ses sources."}
          </p>
          <p>
            {en
              ? "Tutorials are hand-written, tested, and kept up to date. No mass-generated content."
              : "Les tutoriels sont écrits à la main, testés, et mis à jour. Pas de contenu généré à la chaîne."}
          </p>
          <h2>{en ? "Independence" : "Indépendance"}</h2>
          <p>
            {en
              ? "signal·ia depends on no investor, no ad network, no company in the sector it reports on. The site is funded by the newsletter and possible future premium plans."
              : "signal·ia ne dépend d'aucun investisseur, d'aucune régie publicitaire, d'aucune entreprise du secteur dont nous rendons compte. Le site est financé par la newsletter et d'éventuelles formules premium à venir."}
          </p>
          <blockquote>
            {en
              ? "“Sober, credible, no ads or trackers.” It's both our editorial promise and our technical model."
              : "« Sobre, crédible, sans pub ni traceurs. » C'est à la fois notre promesse éditoriale et notre modèle technique."}
          </blockquote>
          <h2>Contact</h2>
          <p>
            {en ? "To suggest a source, report an error or ask a question, use the " : "Pour suggérer une source, signaler une erreur ou poser une question, utilisez le "}
            <Link href="/contact">{en ? "contact form" : "formulaire de contact"}</Link>.
          </p>
        </div>
      </PageBand>
    </div>
  );
}
