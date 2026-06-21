import type { Metadata } from "next";
import { Space_Grotesk, Lora, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Ticker, type TickerItem } from "@/components/Ticker";
import { CommandPalette } from "@/components/CommandPalette";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { getBreakingArticles, getAllArticles, localizeMeta } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { isAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { splitBrand } from "@/lib/brand";
import { getSystemStatus } from "@/lib/status";
import { headers } from "next/headers";
import { MaintenancePage } from "@/components/MaintenancePage";
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

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, tagline, seoDescription } = getSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteName} — ${tagline}`,
      template: `%s — ${siteName}`,
    },
    description: seoDescription,
    alternates: {
      types: { "application/rss+xml": `${siteUrl}/flux.xml` },
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: siteName },
    openGraph: {
      siteName,
      locale: "fr_FR",
      type: "website",
    },
  };
}

const themeInit = `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light";}catch(e){}})();`;
const swInit = `if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(()=>{})}`;

function Logo({ className = "", name }: { className?: string; name: string }) {
  const { before, after } = splitBrand(name);
  return (
    <Link
      href="/"
      className={`font-display leading-none tracking-tight whitespace-nowrap ${className}`}
    >
      {before}
      {after && (
        <>
          <span className="text-[var(--accent)]">·</span>
          <span className="italic">{after}</span>
        </>
      )}
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
  const adminAuth = await isAuthenticated();
  const settings = getSettings();
  const systemStatus = getSystemStatus();
  const statusColor =
    systemStatus.level === "ok"
      ? "var(--ok)"
      : systemStatus.level === "degraded"
        ? "var(--er)"
        : systemStatus.level === "stale"
          ? "var(--wn)"
          : "var(--ink-f)";
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (settings.maintenanceMode && !adminAuth && !pathname.startsWith("/admin")) {
    return (
      <html lang={lang} className={`${spaceGrotesk.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
        <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
        <body className="flex min-h-full flex-col">
          <div className="grain-layer" aria-hidden="true" />
          <MaintenancePage />
        </body>
      </html>
    );
  }

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
    { href: "/", label: t.home, icon: "⌂" },
    { href: "/actus", label: t.navAllNews, icon: "◈" },
    { href: "/tutos", label: t.navTutos, icon: "⊗" },
    { href: "/glossaire", label: t.navGlossary, icon: "A" },
    { href: "/cette-semaine", label: t.navWeek, icon: "◉" },
    { href: "/trending", label: t.navTrending, icon: "↑" },
    { href: "/sources", label: t.footerSources, icon: "⊂" },
    { href: "/recherche", label: t.searchTitle, icon: "⌕" },
    { href: "/favoris", label: t.favoritesTitle, icon: "♡" },
    { href: "/a-propos", label: t.footerAbout, icon: "◎" },
    { href: "/contact", label: t.contactTitle, icon: "✉" },
  ];

  // Ticker : breaking en priorité, sinon 6 actus récentes
  const breaking = await getBreakingArticles();
  let tickerItems: TickerItem[];
  let tickerLabel: string;
  if (breaking.length > 0) {
    tickerItems = breaking.map((a) => ({
      slug: a.slug,
      title: localizeMeta(a, lang).title,
      time: new Date(a.date).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
    }));
    tickerLabel = t.breaking;
  } else {
    const recent = await getAllArticles({ limit: 10 });
    tickerItems = recent.map((a) => ({
      slug: a.slug,
      title: localizeMeta(a, lang).title,
      time: new Date(a.date).toLocaleString(locale, { day: "numeric", month: "short" }),
    }));
    tickerLabel = lang === "en" ? "LATEST" : "ACTUS";
  }

  const nav = (
    <>
      <SiteHeader
        links={navLinks}
        lang={lang}
        labels={{
          search: t.navSearch,
          favorites: t.favoritesTitle,
          menu: t.menu,
          close: t.close,
        }}
        isAdmin={adminAuth}
        siteName={settings.siteName}
      />
      <Ticker items={tickerItems} label={tickerLabel} />
    </>
  );

  const footer = (
    <>
      <footer
        className="has-scanlines mt-auto border-t border-line"
        style={{ background: "var(--bg-d)" }}
      >
        <div className="wrap" style={{ paddingTop: "var(--s9)", paddingBottom: "var(--s6)" }}>
          <div className="mb-12 grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            <div className="flex flex-col gap-4">
              <Logo className="text-[22px]" name={settings.siteName} />
              <p className="max-w-[220px] font-serif text-sm leading-relaxed text-[var(--ink-d)]">
                {t.footerDesc}
              </p>
              <p
                className="flex items-center gap-1.5 font-mono text-[11px]"
                style={{ color: statusColor }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "currentColor",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {lang === "en" ? systemStatus.en : systemStatus.fr}
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
              © {new Date().getFullYear()} watch·ia — {t.footerRights}
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
    </>
  );

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: settings.siteName,
        url: siteUrl,
        description: settings.seoDescription,
        logo: { "@type": "ImageObject", url: `${siteUrl}/icon-512.png` },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: settings.siteName,
        url: siteUrl,
        inLanguage: lang === "en" ? "en" : "fr",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/recherche?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang={lang}
      className={`${spaceGrotesk.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Script id="sw-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: swInit }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <div className="grain-layer" aria-hidden="true" />
        <ConditionalLayout nav={nav} footer={footer}>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
