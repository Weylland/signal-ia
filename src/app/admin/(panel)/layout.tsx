import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="nb-card h-fit w-full shrink-0 p-5 lg:sticky lg:top-24 lg:w-56">
        <p className="font-display text-lg font-bold">
          Admin<span className="text-[var(--sunshine-2)]">.</span>
        </p>
        <nav className="mt-4 flex flex-col gap-1 text-sm font-medium">
          <Link href="/admin" className="nb-navlink">
            ◆ Tableau de bord
          </Link>
          <Link href="/admin/articles" className="nb-navlink">
            ◆ Articles
          </Link>
          <Link href="/admin/articles/new" className="nb-navlink">
            ◆ Nouvel article
          </Link>
          <Link href="/admin/tags" className="nb-navlink">
            ◆ Tags
          </Link>
          <Link href="/admin/pipeline" className="nb-navlink">
            ◆ Pipeline
          </Link>
          <Link href="/admin/reglages" className="nb-navlink">
            ◆ Réglages
          </Link>
          <Link href="/" className="nb-navlink">
            ◆ Voir le site
          </Link>
        </nav>
        <div className="mt-6 border-t-2 border-ink pt-4">
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
