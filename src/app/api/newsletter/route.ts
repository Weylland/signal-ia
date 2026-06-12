import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now < entry.reset) {
    if (entry.count >= 5) {
      return NextResponse.json({ error: "Trop de tentatives" }, { status: 429 });
    }
    entry.count++;
  } else {
    attempts.set(ip, { count: 1, reset: now + 15 * 60_000 });
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
