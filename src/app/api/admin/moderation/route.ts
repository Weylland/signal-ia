import { NextRequest, NextResponse } from "next/server";
import { publishPendingItem, rejectPendingItem } from "@/lib/moderation";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const { id, action } = await req.json() as { id: number; action: "publish" | "reject" };

  if (action === "reject") {
    rejectPendingItem(id);
    return NextResponse.json({ ok: true });
  }

  try {
    const slug = await publishPendingItem(id);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur";
    const status = message === "Item introuvable" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
