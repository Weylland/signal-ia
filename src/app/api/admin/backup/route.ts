import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { runBackup, latestBackup, backupCount } from "@/lib/backup";

// Déclenche un backup manuel (protégé par le middleware admin)
export async function POST() {
  try {
    const file = await runBackup();
    return NextResponse.json({ ok: true, file: path.basename(file), count: backupCount() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Échec du backup" },
      { status: 500 }
    );
  }
}

// Télécharge le dernier snapshot
export async function GET() {
  const file = latestBackup();
  if (!file) {
    return NextResponse.json({ error: "Aucun backup disponible" }, { status: 404 });
  }
  const data = new Uint8Array(readFileSync(file));
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${path.basename(file)}"`,
      "Cache-Control": "no-store",
    },
  });
}
