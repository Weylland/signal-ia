import { NextResponse } from "next/server";
import { runXDigest } from "@/lib/x";

export async function POST() {
  try {
    const result = await runXDigest("fr");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
