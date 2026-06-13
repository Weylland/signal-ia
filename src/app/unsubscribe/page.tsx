import { removeSubscriber } from "@/lib/newsletter";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email.trim() : "";
  let done = false;

  if (email) {
    removeSubscriber(email);
    done = true;
  }

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      {done ? (
        <>
          <p className="font-display text-3xl">Désinscription effectuée</p>
          <p className="mt-4 text-[var(--ink-dim)]">{email} a été retiré de la liste.</p>
        </>
      ) : (
        <p className="text-[var(--ink-dim)]">Lien invalide.</p>
      )}
      <Link href="/" className="nb-btn mt-8 inline-block">← Retour au site</Link>
    </div>
  );
}
