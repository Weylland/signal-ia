import { NextRequest, NextResponse } from "next/server";
import { deleteXPost } from "@/lib/x";

export async function POST(req: NextRequest) {
  const { id } = await req.json().catch(() => ({ id: null })) as { id?: number };
  if (typeof id !== "number") return NextResponse.json({ error: "id requis" }, { status: 400 });
  try {
    const result = await deleteXPost(id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
