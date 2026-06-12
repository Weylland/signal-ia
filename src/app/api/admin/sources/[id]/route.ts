import { NextRequest, NextResponse } from "next/server";
import { updateSource, deleteSource } from "@/lib/sources";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  try {
    updateSource(Number(id), {
      name: typeof body.name === "string" ? body.name : undefined,
      url: typeof body.url === "string" ? body.url : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteSource(Number(id));
  return NextResponse.json({ ok: true });
}
