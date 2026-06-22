import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { removeSubscriber, verifyUnsubToken } from "@/lib/newsletter";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`newsletter:${ip}`, 3, 15 * 60_000)) {
    return rateLimitResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  getDb()
    .prepare("INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)")
    .run(email);
  return NextResponse.json({ ok: true });
}

// Désinscription : action confirmée par l'utilisateur (DELETE déclenché par un
// bouton), pas un simple GET — évite qu'un pré-chargement de lien email désabonne
// à l'insu de la personne. Le token JWT signé garantit l'identité.
export async function DELETE(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const email = token ? await verifyUnsubToken(token) : null;
  if (!email) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  }

  removeSubscriber(email);
  return NextResponse.json({ ok: true, email });
}
