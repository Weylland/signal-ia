import type { Metadata } from "next";
import { Space_Grotesk, Lora, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Ticker, type TickerItem } from "@/components/Ticker";
import { CommandPalette } from "@/components/CommandPalette";
import { getBreakingArticles, localizeMeta } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "signal·ia" },
  openGraph: {
    siteName: "signal·ia",
    locale: "fr_FR",
    type: "website",
  },
};

const themeInit = `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light";}catch(e){}})();`;
const swInit = `if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(()=>{})}`;

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display leading-none tracking-tight whitespace-nowrap ${className}`}
    >
      signal<span className="text-[var(--accent)]">·</span>
      <span className="italic">ia</span>
    </Link>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  const t = getDict(lang);
  const locale = lang === "en" ? "en-GB" : "fr-FR";

  // Liens de la nav principale (header desktop + drawer mobile)
  const navLinks = [
    { href: "/actus", label: t.navAllNews },
    { href: "/tutos", label: t.navTutos },
    { href: "/glossaire", label: t.navGlossary },
    { href: "/cette-semaine", label: t.navWeek },
    { href: "/trending", label: t.navTrending },
    { href: "/sources", label: t.footerSources },
  ];

  // Liste complète pour la command palette
  const pages = [
    { href: "/", label: t.home },
    ...navLinks,
    { href: "/recherche", label: t.searchTitle },
    { href: "/favoris", label: t.favoritesTitle },
    { href: "/a-propos", label: t.footerAbout },
    { href: "/contact", label: t.contactTitle },
  ];

  // Ticker d'alertes (breaking)
  const breaking = await getBreakingArticles();
  const tickerItems: TickerItem[] = breaking.map((a) => ({
    slug: a.slug,
    title: localizeMeta(a, lang).title,
    time: new Date(a.date).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <html
      lang={lang}
      className={`${spaceGrotesk.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script dangerouslySetInnerHTML={{ __html: swInit }} />
        <div className="grain-layer" aria-hidden="true" />

        <Ticker items={tickerItems} label={t.breaking} />
        <SiteHeader
          links={navLinks}
          lang={lang}
          labels={{
            search: t.navSearch,
            favorites: t.favoritesTitle,
            menu: t.menu,
            close: t.close,
          }}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

        <footer
          className="has-scanlines mt-auto border-t border-line"
          style={{ background: "var(--bg-d)" }}
        >
          <div className="wrap" style={{ paddingTop: "var(--s9)", paddingBottom: "var(--s6)" }}>
            <div className="mb-12 grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              <div className="flex flex-col gap-4">
                <Logo className="text-[22px]" />
                <p className="max-w-[220px] font-serif text-sm leading-relaxed text-[var(--ink-d)]">
                  {t.footerDesc}
                </p>
                <p className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--ok)]">
                  <span className="s-ok" />
                  {lang === "en" ? "All systems operational" : "Tous systèmes opérationnels"}
                </p>
              </div>

              <div>
                <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                  {t.footerSections}
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    [t.navAllNews, "/actus"],
                    [t.navTutos, "/tutos"],
                    [t.navGlossary, "/glossaire"],
                    [t.navWeek, "/cette-semaine"],
                    [t.navTrending, "/trending"],
                  ].map(([l, p]) => (
                    <Link key={p} href={p} className="w-fit text-sm text-[var(--ink-d)] transition-colors hover:text-[var(--ink)]">
                      {l}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                  {t.footerFollow}
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    [t.footerAbout, "/a-propos"],
                    [t.footerSources, "/sources"],
                    [t.footerContact, "/contact"],
                    [t.favoritesTitle, "/favoris"],
                  ].map(([l, p]) => (
                    <Link key={p} href={p} className="w-fit text-sm text-[var(--ink-d)] transition-colors hover:text-[var(--ink)]">
                      {l}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                  {t.newsletterTitle}
                </p>
                <p className="mb-3 font-serif text-[13px] leading-relaxed text-[var(--ink-d)]">
                  {t.newsletterPitch}
                </p>
                <NewsletterForm
                  labels={{ subscribe: t.subscribe, subscribed: t.subscribed, error: t.emailError }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <span className="font-mono text-[11px] text-[var(--ink-f)]">
                © {new Date().getFullYear()} signal·ia — {t.footerRights}
              </span>
              <span className="flex gap-5 font-mono text-[11px] text-[var(--ink-f)]">
                <a href="/flux.xml" className="transition-colors hover:text-[var(--ac)]">RSS ↗</a>
                <Link href="/mentions-legales" className="transition-colors hover:text-[var(--ac)]">
                  {t.footerLegal}
                </Link>
                <Link href="/confidentialite" className="transition-colors hover:text-[var(--ac)]">
                  {t.footerPrivacy}
                </Link>
              </span>
            </div>
          </div>
        </footer>

        <CommandPalette
          pages={pages}
          lang={lang}
          placeholder={t.commandPlaceholder}
          pagesLabel={t.commandPages}
          searchLabel={lang === "en" ? "Search" : "Rechercher"}
        />
      </body>
    </html>
  );
}
