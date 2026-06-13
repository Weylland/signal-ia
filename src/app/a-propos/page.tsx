import type { Metadata } from "next";
import Link from "next/link";
import { FadeUp } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "signal·ia couvre chaque jour l'essentiel de l'actualité de l'intelligence artificielle et de la robotique. Sélection resserrée, sources citées, zéro bruit.",
};

const stats = [
  { value: "1×/jour", label: "Sélection resserrée" },
  { value: "100%", label: "Articles sourcés" },
  { value: "0", label: "Pub · traceur · compte" },
];

const steps = [
  {
    n: "01",
    title: "Veille en continu",
    body: "Une sélection de médias et de blogs spécialisés est surveillée en permanence, jour et nuit.",
  },
  {
    n: "02",
    title: "Tri par l'IA",
    body: "Chaque actualité est notée et regroupée automatiquement. Seul ce qui compte vraiment est retenu.",
  },
  {
    n: "03",
    title: "Tu lis l'essentiel",
    body: "Des articles courts, en français, qui citent leurs sources. Pas un flux infini à trier toi-même.",
  },
];

const principles = [
  "Pas de publicité, pas de traceurs, pas de compte à créer.",
  "Chaque article cite ses sources — tu remontes toujours à l'origine.",
  "Le tri est assumé : mieux vaut cinq infos qui comptent que cinquante qui noient.",
  "Site volontairement léger, rapide, lisible en clair comme en sombre.",
];

export default function AProposPage() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <FadeUp>
        <header className="mb-12">
          <p className="meta uppercase text-[var(--accent)]">À propos</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            L&apos;essentiel de l&apos;IA,
            <br />
            <span className="italic">trié pour toi.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-dim)]">
            signal·ia suit au quotidien ce qui compte dans l&apos;intelligence artificielle et la
            robotique : nouveaux modèles, agents, financements, recherche, régulation. Une veille en
            continu, résumée chaque jour en clair.
          </p>
        </header>
      </FadeUp>

      {/* Bloc chiffres en relief */}
      <FadeUp delay={0.05}>
        <div className="mb-16 grid grid-cols-3 divide-x-2 divide-ink border-2 border-ink shadow-[5px_5px_0_var(--ink)]">
          {stats.map((s) => (
            <div key={s.label} className="px-3 py-6 text-center">
              <p className="font-display text-3xl font-bold text-[var(--accent)] sm:text-4xl">
                {s.value}
              </p>
              <p className="meta mt-2 uppercase leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* Comment ça marche */}
      <FadeUp delay={0.05}>
        <section className="mb-16">
          <div className="section-head">
            <span className="idx">→</span>
            <h2>Comment ça marche</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="nb-card flex flex-col p-5">
                <span className="font-display text-4xl text-[var(--ink-faint)]">{step.n}</span>
                <h3 className="mt-3 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeUp>

      {/* Principes */}
      <FadeUp delay={0.05}>
        <section className="mb-16">
          <div className="section-head">
            <span className="idx">★</span>
            <h2>Le parti pris</h2>
          </div>
          <ul className="flex flex-col gap-px overflow-hidden border-2 border-ink">
            {principles.map((p, i) => (
              <li
                key={i}
                className="flex items-baseline gap-4 bg-[var(--bg-raised)] px-5 py-4"
              >
                <span className="font-display text-lg text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm leading-relaxed sm:text-base">{p}</span>
              </li>
            ))}
          </ul>
        </section>
      </FadeUp>

      {/* Qui édite + CTA */}
      <FadeUp delay={0.05}>
        <section className="nb-card border-2 border-ink p-6 sm:p-8">
          <h2 className="font-display text-2xl">Qui est derrière</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-dim)] sm:text-base">
            signal·ia est édité par un développeur indépendant, passionné d&apos;IA et
            d&apos;automatisation. Le site est un projet vivant : le tri, les rubriques et les
            formats évoluent en continu. Une question, une remarque, un sujet à signaler ?
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="nb-btn nb-btn-primary">
              Nous écrire
            </Link>
            <Link href="/sources" className="nb-btn">
              Voir nos sources
            </Link>
            <a href="/flux.xml" className="nb-btn">
              Flux RSS
            </a>
          </div>
        </section>
      </FadeUp>

      <FadeUp delay={0.05}>
        <div className="mt-12 border-t border-line pt-8">
          <Link href="/" className="nb-btn nb-btn-primary">
            ← Voir les actualités
          </Link>
        </div>
      </FadeUp>
    </div>
  );
}
