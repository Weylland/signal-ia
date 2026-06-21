import { NextResponse } from "next/server";
import { translateGlossaryToEn } from "@/lib/glossary";

export async function POST() {
  try {
    const result = await translateGlossaryToEn();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
