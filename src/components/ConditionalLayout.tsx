"use client";
import { usePathname } from "next/navigation";
import { PageTracker } from "./PageTracker";

export function ConditionalLayout({
  children,
  nav,
  footer,
  lang,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  lang: string;
}) {
  const path = usePathname() ?? "";
  const isAdmin = path.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <PageTracker lang={lang} />
      {nav}
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        {children}
      </main>
      {footer}
    </>
  );
}
