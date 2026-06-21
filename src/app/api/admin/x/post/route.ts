import { NextRequest, NextResponse } from "next/server";
import { runXDigest } from "@/lib/x";

export async function POST(req: NextRequest) {
  const { dryRun } = await req.json().catch(() => ({ dryRun: false })) as { dryRun?: boolean };
  try {
    const result = await runXDigest("fr", { dryRun: Boolean(dryRun) });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
