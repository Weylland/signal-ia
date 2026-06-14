import type { Metadata } from "next";
import { Space_Grotesk, Lora, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ThemeToggle, LangSwitcher } from "@/components/TopbarControls";
import { NavMenu } from "@/components/NavMenu";
import { MobileMenu } from "@/components/MobileMenu";
import { CommandPalette } from "@/components/CommandPalette";
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

  const today = new Date().toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Liste partagée par le menu burger et la command palette
  const pages = [
    { href: "/", label: t.home },
    { href: "/actus", label: t.navAllNews },
    { href: "/cette-semaine", label: t.navWeek },
    { href: "/trending", label: t.navTrending },
    { href: "/tutos", label: t.navTutos },
    { href: "/glossaire", label: t.navGlossary },
    { href: "/sources", label: t.footerSources },
    { href: "/recherche", label: t.searchTitle },
    { href: "/favoris", label: t.favoritesTitle },
    { href: "/a-propos", label: t.footerAbout },
    { href: "/contact", label: t.contactTitle },
  ];

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

        <div className="border-b border-line">
          <div className="meta mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-1.5 uppercase">
            <span>
              <span className="live-dot" />
              {t.topbarEdition} — {today}
            </span>
            <span className="flex items-center gap-4">
              <span className="hidden sm:inline">{t.topbarTag}</span>
              <ThemeToggle />
              <LangSwitcher lang={lang} />
            </span>
          </div>
        </div>

        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-center gap-x-8 px-5 py-4">
            <Logo className="text-3xl sm:text-4xl" />
            <NavMenu
              labels={{
                news: t.navNews,
                week: t.navWeek,
                trending: t.navTrending,
                tutos: t.navTutos,
                glossary: t.navGlossary,
                sources: lang === "en" ? "Sources" : "Sources",
                about: t.footerAbout,
              }}
            />
            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/favoris"
                className="hidden text-lg sm:inline"
                title={t.favoritesTitle}
                aria-label={t.favoritesTitle}
              >
                ★
              </Link>
              <Link href="/recherche" className="nb-btn hidden px-3 py-1.5 text-xs sm:inline-flex">
                {t.navSearch}
              </Link>
              <a href="/flux.xml" className="nb-btn hidden px-3 py-1.5 text-xs sm:inline-flex">
                RSS
              </a>
              <MobileMenu
                pages={pages}
                labels={{ menu: t.menu, close: t.close, search: t.navSearch, rss: "RSS" }}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

        <footer className="border-t border-line bg-[var(--bg-deep)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo className="text-2xl" />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--ink-dim)]">
                {t.footerDesc}
              </p>
            </div>
            <div className="text-sm">
              <p className="meta mb-4 font-semibold uppercase">{t.footerSections}</p>
              <ul className="flex flex-col gap-2 text-[var(--ink-dim)]">
                <li><Link href="/" className="nb-navlink">{t.navNews}</Link></li>
                <li><Link href="/actus" className="nb-navlink">{t.navAllNews}</Link></li>
                <li><Link href="/tutos" className="nb-navlink">{t.navTutos}</Link></li>
                <li><Link href="/glossaire" className="nb-navlink">{t.navGlossary}</Link></li>
                <li><Link href="/cette-semaine" className="nb-navlink">{t.navWeek}</Link></li>
                <li><Link href="/trending" className="nb-navlink">{lang === "en" ? "Trending" : "Tendances"}</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="meta mb-4 font-semibold uppercase">{t.footerFollow}</p>
              <ul className="flex flex-col gap-2 text-[var(--ink-dim)]">
                <li><Link href="/recherche" className="nb-navlink">{t.footerSearch}</Link></li>
                <li><Link href="/sources" className="nb-navlink">{t.footerSources}</Link></li>
                <li><Link href="/a-propos" className="nb-navlink">{t.footerAbout}</Link></li>
                <li><Link href="/contact" className="nb-navlink">{t.footerContact}</Link></li>
                <li><a href="/flux.xml" className="nb-navlink">{t.footerRss}</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="meta mb-4 font-semibold uppercase">{t.newsletterTitle}</p>
              <p className="mb-3 text-xs leading-relaxed text-[var(--ink-dim)]">
                {t.newsletterPitch}
              </p>
              <NewsletterForm
                labels={{ subscribe: t.subscribe, subscribed: t.subscribed, error: t.emailError }}
              />
            </div>
          </div>
          <div className="border-t border-line">
            <div className="meta mx-auto flex max-w-6xl flex-wrap justify-between gap-x-5 gap-y-2 px-5 py-4 uppercase">
              <span>
                © {new Date().getFullYear()} signal·ia — {t.footerRights}
              </span>
              <span className="flex gap-4">
                <Link href="/mentions-legales" className="hover:text-[var(--accent)]">
                  {t.footerLegal}
                </Link>
                <Link href="/confidentialite" className="hover:text-[var(--accent)]">
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
