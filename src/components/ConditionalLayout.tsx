"use client";
import { usePathname } from "next/navigation";

export function ConditionalLayout({
  children,
  nav,
  footer,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
}) {
  const path = usePathname() ?? "";
  const isAdmin = path.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {nav}
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        {children}
      </main>
      {footer}
    </>
  );
}
