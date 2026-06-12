import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "signal·ia — la veille IA quotidienne",
    template: "%s — signal·ia",
  },
  description:
    "L'actualité de l'intelligence artificielle et de la robotique, sélectionnée et rédigée chaque jour par un agent IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
            <Link href="/" className="font-display text-xl font-bold tracking-tight">
              signal<span className="text-accent">·</span>ia
            </Link>
            <p className="hidden font-mono text-xs text-muted sm:block">
              veille IA quotidienne <span className="text-accent">/</span> générée par un agent
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              signal·ia — articles sélectionnés et rédigés par un agent IA à partir de sources
              publiques, citées sur chaque article.
            </p>
            <p>pipeline open source · Next.js</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
