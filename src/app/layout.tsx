import type { Metadata } from "next";
import { Instrument_Serif, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "signal·ia — l'essentiel de l'actu IA et robotique",
    template: "%s — signal·ia",
  },
  description:
    "Veille IA en continu, en français : les news qui comptent sur l'intelligence artificielle, la robotique et le dev lié à l'IA, plus des tutos pratiques.",
  alternates: {
    types: { "application/rss+xml": `${siteUrl}/flux.xml` },
  },
  openGraph: {
    siteName: "signal·ia",
    locale: "fr_FR",
    type: "website",
  },
};

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`font-display leading-none tracking-tight whitespace-nowrap ${className}`}>
      signal<span className="text-[var(--accent)]">·</span>
      <span className="italic">ia</span>
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <html
      lang="fr"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="border-b border-line">
          <div className="meta mx-auto flex max-w-6xl justify-between gap-4 px-5 py-1.5 uppercase">
            <span>
              <span className="live-dot" />
              Édition continue — {today}
            </span>
            <span className="hidden sm:inline">Veille IA · FR</span>
          </div>
        </div>

        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
            <Logo className="text-3xl sm:text-4xl" />
            <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto sm:order-none sm:w-auto sm:gap-7">
              <Link href="/" className="mainnav-link">
                Actu
              </Link>
              <Link href="/tutos" className="mainnav-link">
                Tutos
              </Link>
              <Link href="/glossaire" className="mainnav-link">
                Glossaire
              </Link>
              <Link href="/cette-semaine" className="mainnav-link">
                Cette semaine
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/recherche" className="nb-btn px-3 py-1.5 text-xs">
                Rechercher
              </Link>
              <a href="/flux.xml" className="nb-btn hidden px-3 py-1.5 text-xs sm:inline-flex">
                RSS
              </a>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

        <footer className="border-t border-line bg-[var(--bg-deep)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo className="text-2xl" />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--ink-dim)]">
                Média français de veille IA. L&apos;essentiel de l&apos;actualité de
                l&apos;intelligence artificielle et de la robotique, en continu.
              </p>
            </div>
            <div className="text-sm">
              <p className="meta mb-4 font-semibold uppercase">Rubriques</p>
              <ul className="flex flex-col gap-2 text-[var(--ink-dim)]">
                <li><Link href="/" className="nb-navlink">Actu</Link></li>
                <li><Link href="/tutos" className="nb-navlink">Tutos</Link></li>
                <li><Link href="/glossaire" className="nb-navlink">Glossaire</Link></li>
                <li><Link href="/cette-semaine" className="nb-navlink">Cette semaine</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="meta mb-4 font-semibold uppercase">Suivre</p>
              <ul className="flex flex-col gap-2 text-[var(--ink-dim)]">
                <li><Link href="/recherche" className="nb-navlink">Recherche</Link></li>
                <li><Link href="/sources" className="nb-navlink">Nos sources</Link></li>
                <li><Link href="/a-propos" className="nb-navlink">À propos</Link></li>
                <li><a href="/flux.xml" className="nb-navlink">Flux RSS</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="meta mb-4 font-semibold uppercase">Newsletter</p>
              <p className="mb-3 text-xs leading-relaxed text-[var(--ink-dim)]">
                Le récap de la semaine, un email le dimanche, rien d&apos;autre.
              </p>
              <NewsletterForm />
            </div>
          </div>
          <div className="border-t border-line">
            <div className="meta mx-auto flex max-w-6xl flex-wrap justify-between gap-x-5 gap-y-2 px-5 py-4 uppercase">
              <span>© {new Date().getFullYear()} signal·ia — Tous droits réservés</span>
              <span className="flex gap-4">
                <Link href="/mentions-legales" className="hover:text-[var(--accent)]">
                  Mentions légales
                </Link>
                <Link href="/confidentialite" className="hover:text-[var(--accent)]">
                  Confidentialité
                </Link>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
