import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
};

export default function ConfidentialitePage() {
  const { siteName } = getSettings();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold">Politique de confidentialité</h1>
      <div className="prose-article mt-8">
        <p>
          {siteName} est conçu pour respecter votre vie privée. En résumé : nous ne collectons
          aucune donnée personnelle sur les visiteurs.
        </p>

        <h2>Données collectées</h2>
        <p>
          La consultation du site ne nécessite aucun compte et ne déclenche aucune collecte de
          données personnelles : pas de formulaire, pas de newsletter, pas d&apos;outil de mesure
          d&apos;audience, pas de publicité.
        </p>

        <h2>Cookies</h2>
        <p>
          Aucun cookie n&apos;est déposé lors de la consultation du site. C&apos;est pourquoi
          aucune bannière de consentement n&apos;est affichée. Seul l&apos;espace
          d&apos;administration, réservé à l&apos;éditeur, utilise un cookie de session strictement
          nécessaire à l&apos;authentification — exempté de consentement au sens des lignes
          directrices de la CNIL.
        </p>

        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc. Comme tout hébergeur, Vercel peut traiter des
          journaux techniques (adresses IP) pour la sécurité et le fonctionnement de
          l&apos;infrastructure. Ces journaux ne sont pas exploités par l&apos;éditeur.
        </p>

        <h2>Vos droits</h2>
        <p>
          Conformément au Règlement général sur la protection des données (RGPD) et à la loi
          Informatique et Libertés, vous disposez de droits d&apos;accès, de rectification,
          d&apos;effacement et d&apos;opposition sur vos données. Pour toute question :{" "}
          <a href="mailto:gardanor@gmail.com">gardanor@gmail.com</a>. Vous pouvez également saisir
          la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
        </p>

        <h2>Mise à jour</h2>
        <p>Cette politique pourra être mise à jour si les pratiques du site évoluent.</p>
      </div>
    </div>
  );
}
