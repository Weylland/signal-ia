import { verifyUnsubToken } from "@/lib/newsletter";
import { UnsubscribeConfirm } from "@/components/UnsubscribeConfirm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const email = token ? await verifyUnsubToken(token) : null;

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      {email ? (
        <UnsubscribeConfirm token={token} email={email} />
      ) : (
        <>
          <p className="text-[var(--ink-dim)]">Lien invalide ou expiré.</p>
          <Link href="/" className="nb-btn mt-8 inline-block">← Retour au site</Link>
        </>
      )}
    </div>
  );
}
