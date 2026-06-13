import type { Metadata } from "next";
import { getLang, getDict } from "@/lib/i18n";
import { FadeUp } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter l'équipe de signal·ia — questions, remarques, propositions.",
};

export default async function ContactPage() {
  const lang = await getLang();
  const t = getDict(lang);

  return (
    <div className="mx-auto max-w-2xl">
      <FadeUp>
        <header className="mb-8">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.contactTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.contactIntro}</p>
        </header>
      </FadeUp>
      <FadeUp delay={0.1}>
        <ContactForm
          labels={{
            name: t.contactName,
            email: t.contactEmail,
            message: t.contactMessage,
            send: t.contactSend,
            sent: t.contactSent,
            error: t.contactError,
          }}
        />
      </FadeUp>
    </div>
  );
}
