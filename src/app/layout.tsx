import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
              signal<span className="text-accent">·</span>ia
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="link-underline">
                Accueil
              </Link>
              <Link href="/a-propos" className="link-underline">
                À propos
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

        <footer className="mt-16 border-t border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-3">
            <div>
              <p className="font-display text-xl font-semibold">
                signal<span className="text-accent">·</span>ia
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
                L&apos;essentiel de l&apos;actualité de l&apos;intelligence artificielle et de la
                robotique, chaque matin.
              </p>
            </div>
            <div className="text-sm">
              <p className="mb-3 font-semibold">Navigation</p>
              <ul className="flex flex-col gap-2 text-muted">
                <li>
                  <Link href="/" className="hover:text-accent-deep">Accueil</Link>
                </li>
                <li>
                  <Link href="/a-propos" className="hover:text-accent-deep">À propos</Link>
                </li>
                <li>
                  <a href="/flux.xml" className="hover:text-accent-deep">Flux RSS</a>
                </li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="mb-3 font-semibold">Informations</p>
              <ul className="flex flex-col gap-2 text-muted">
                <li>
                  <Link href="/mentions-legales" className="hover:text-accent-deep">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="hover:text-accent-deep">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border">
            <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted">
              © {new Date().getFullYear()} signal·ia. Tous droits réservés.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
