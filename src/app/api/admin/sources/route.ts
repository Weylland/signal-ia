import { NextRequest, NextResponse } from "next/server";
import { getSources, addSource } from "@/lib/sources";

export async function GET() {
  return NextResponse.json(getSources());
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!name || !url.startsWith("http")) {
    return NextResponse.json({ error: "Nom et URL de flux obligatoires" }, { status: 400 });
  }

  try {
    addSource(name, url);
  } catch {
    return NextResponse.json({ error: "Cette URL existe déjà" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
