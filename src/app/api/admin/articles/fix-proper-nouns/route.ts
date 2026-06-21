import { NextResponse } from "next/server";
import { fixProperNouns } from "@/lib/maintenance";

export async function POST() {
  try {
    const result = fixProperNouns();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
