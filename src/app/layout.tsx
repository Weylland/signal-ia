import type { Metadata } from "next";
import { Instrument_Serif, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ThemeToggle, LangSwitcher } from "@/components/TopbarControls";
import { getLang, getDict } from "@/lib/i18n";
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

const themeInit = `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light";}catch(e){}})();`;

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

  return (
    <html
      lang={lang}
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />

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
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
            <Logo className="text-3xl sm:text-4xl" />
            <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto sm:order-none sm:w-auto sm:gap-7">
              <Link href="/" className="mainnav-link">
                {t.navNews}
              </Link>
              <Link href="/tutos" className="mainnav-link">
                {t.navTutos}
              </Link>
              <Link href="/glossaire" className="mainnav-link">
                {t.navGlossary}
              </Link>
              <Link href="/cette-semaine" className="mainnav-link">
                {t.navWeek}
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/recherche" className="nb-btn px-3 py-1.5 text-xs">
                {t.navSearch}
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
              </ul>
            </div>
            <div className="text-sm">
              <p className="meta mb-4 font-semibold uppercase">{t.footerFollow}</p>
              <ul className="flex flex-col gap-2 text-[var(--ink-dim)]">
                <li><Link href="/recherche" className="nb-navlink">{t.footerSearch}</Link></li>
                <li><Link href="/sources" className="nb-navlink">{t.footerSources}</Link></li>
                <li><Link href="/a-propos" className="nb-navlink">{t.footerAbout}</Link></li>
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
      </body>
    </html>
  );
}
