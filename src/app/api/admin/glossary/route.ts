import { NextRequest, NextResponse } from "next/server";
import { upsertGlossaryEntry, deleteGlossaryEntry, translateGlossaryToEn } from "@/lib/glossary";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const { term, defFr, defEn } = await req.json() as { term: string; defFr: string; defEn?: string };
  upsertGlossaryEntry(term, `<p>${defFr.trim()}</p>`);
  const db = getDb();
  const slug = term.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (defEn?.trim()) {
    db.prepare("UPDATE glossary SET definition_html_en = ? WHERE slug = ?")
      .run(`<p>${defEn.trim()}</p>`, slug);
  } else {
    translateGlossaryToEn().catch(() => {});
  }
  revalidatePath("/glossaire");
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const { id, term, defFr, defEn } = await req.json() as { id: number; term: string; defFr: string; defEn?: string };
  upsertGlossaryEntry(term, `<p>${defFr.trim()}</p>`, id);
  const db = getDb();
  if (defEn?.trim()) {
    db.prepare("UPDATE glossary SET definition_html_en = ? WHERE id = ?")
      .run(`<p>${defEn.trim()}</p>`, id);
  } else {
    translateGlossaryToEn().catch(() => {});
  }
  revalidatePath("/glossaire");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id: number };
  deleteGlossaryEntry(id);
  revalidatePath("/glossaire");
  return NextResponse.json({ ok: true });
}
