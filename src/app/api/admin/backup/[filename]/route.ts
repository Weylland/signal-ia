import { NextRequest, NextResponse } from "next/server";
import { unlinkSync, existsSync } from "node:fs";
import path from "node:path";
import { backupDir } from "@/lib/backup";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sécurité : nom de fichier seulement, pas de path traversal
  const base = path.basename(filename);
  if (!base.startsWith("backup-") || !base.endsWith(".sqlite")) {
    return NextResponse.json({ error: "Fichier invalide" }, { status: 400 });
  }

  const filePath = path.join(backupDir(), base);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  unlinkSync(filePath);
  return NextResponse.json({ ok: true });
}
