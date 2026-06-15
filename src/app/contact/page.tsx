import type { Metadata } from "next";
import { getLang, getDict } from "@/lib/i18n";
import { ContactForm } from "@/components/ContactForm";
import { PageHeader, PageBand } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter l'équipe de signal·ia — questions, remarques, propositions.",
};

export default async function ContactPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";

  return (
    <div className="-mt-10">
      <PageHeader narrow title={t.contactTitle} subtitle={t.contactIntro} />
      <PageBand narrow>
        <ContactForm
          labels={{
            name: en ? "Name / Nickname" : "Prénom / Pseudo",
            email: t.contactEmail,
            subject: en ? "Subject" : "Sujet",
            message: t.contactMessage,
            send: en ? "Send message" : "Envoyer le message",
            sent: t.contactSent,
            sentBody: en ? "Thanks. We usually reply within 48h." : "Merci. Nous répondons généralement sous 48 h.",
            error: t.contactError,
            note: en ? "No tracker. Your email is never shared." : "Aucun tracker. Votre email n'est jamais partagé.",
            back: en ? "Back home" : "Retour à l'accueil",
            subjects: en
              ? ["Source suggestion", "Factual error", "Editorial question", "Collaboration", "Other"]
              : ["Suggestion de source", "Erreur factuelle", "Question éditoriale", "Proposition de collaboration", "Autre"],
          }}
        />
      </PageBand>
    </div>
  );
}
