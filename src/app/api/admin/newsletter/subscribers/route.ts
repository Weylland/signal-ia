import { NextRequest, NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/newsletter";

export async function DELETE(request: NextRequest) {
  let body: { email: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { email } = body;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email manquant" }, { status: 400 });
  }

  removeSubscriber(email);
  return NextResponse.json({ ok: true });
}
