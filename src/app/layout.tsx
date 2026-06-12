import type { Metadata } from "next";
import { Inter, Space_Grotesk, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "signal·ia — l'essentiel de l'actu IA et robotique",
    template: "%s — signal·ia",
  },
  description:
    "Chaque matin, l'essentiel de l'actualité de l'intelligence artificielle et de la robotique : modèles, agents, financements, recherche.",
  alternates: {
    types: { "application/rss+xml": `${siteUrl}/flux.xml` },
  },
  openGraph: {
    siteName: "signal·ia",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${spaceGrotesk.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b-[2.5px] border-ink bg-cream">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link
              href="/"
              className="font-display text-2xl font-bold tracking-tight"
            >
              <span className="mr-1 inline-block border-[2.5px] border-ink bg-sunshine px-1.5 shadow-[2px_2px_0_var(--ink)]">
                S
              </span>
              signal·ia
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold">
              <Link href="/" className="nb-navlink">
                Accueil
              </Link>
              <Link href="/a-propos" className="nb-navlink">
                À propos
              </Link>
              <a href="/flux.xml" className="nb-btn hidden px-3 py-1.5 text-xs sm:inline-flex">
                RSS
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

        <footer className="border-t-[2.5px] border-ink bg-cream-2">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-3">
            <div>
              <p className="font-display text-xl font-bold">
                <span className="mr-1 inline-block border-2 border-ink bg-sunshine px-1 text-sm shadow-[2px_2px_0_var(--ink)]">
                  S
                </span>
                signal·ia
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">
                L&apos;essentiel de l&apos;actualité de l&apos;intelligence artificielle et de la
                robotique, chaque matin.
              </p>
            </div>
            <div className="text-sm">
              <p className="mb-3 font-display font-bold">Navigation</p>
              <ul className="flex flex-col gap-2">
                <li><Link href="/" className="nb-navlink">Accueil</Link></li>
                <li><Link href="/a-propos" className="nb-navlink">À propos</Link></li>
                <li><a href="/flux.xml" className="nb-navlink">Flux RSS</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="mb-3 font-display font-bold">Informations</p>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link href="/mentions-legales" className="nb-navlink">Mentions légales</Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="nb-navlink">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-ink">
            <p className="mx-auto max-w-6xl px-5 py-4 text-xs">
              © {new Date().getFullYear()} signal·ia. Tous droits réservés.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
