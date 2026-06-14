import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  // Max 5 messages / 15 min / IP
  if (!rateLimit(`contact:${ip}`, 5, 15 * 60_000)) {
    return rateLimitResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Honeypot : champ caché qui doit rester vide (rempli = bot)
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }); // on fait semblant d'accepter
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  if (name.length > MAX_NAME || email.length > MAX_EMAIL || message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Champ trop long" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  getDb()
    .prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)")
    .run(name, email, message);

  return NextResponse.json({ ok: true });
}
