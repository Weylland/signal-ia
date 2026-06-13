import { NextResponse } from "next/server";
import { runPipeline } from "../../../../../../pipeline/run";

export async function POST() {
  try {
    await runPipeline();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur pipeline" },
      { status: 500 }
    );
  }
}
