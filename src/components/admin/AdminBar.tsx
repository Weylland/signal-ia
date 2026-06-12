"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminBar({ title }: { title: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <Link href="/admin/articles/new" className="btn btn-primary">
          + Nouvel article
        </Link>
        <Link href="/admin" className="btn btn-ghost">
          Tableau de bord
        </Link>
        <button onClick={logout} className="btn btn-ghost">
          Déconnexion
        </button>
      </div>
    </div>
  );
}
