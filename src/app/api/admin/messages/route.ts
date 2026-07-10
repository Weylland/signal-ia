import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Marque un message comme lu (par id) ou tous les messages (all: true).
export async function POST(request: NextRequest) {
  let body: { id?: number; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const db = getDb();
  if (body.all) {
    db.prepare('UPDATE contact_messages SET "read" = 1 WHERE "read" = 0').run();
  } else if (typeof body.id === "number" && Number.isFinite(body.id)) {
    db.prepare('UPDATE contact_messages SET "read" = 1 WHERE id = ?').run(body.id);
  } else {
    return NextResponse.json({ error: "id ou all requis" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// Supprime un message.
export async function DELETE(request: NextRequest) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }
  getDb().prepare("DELETE FROM contact_messages WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
