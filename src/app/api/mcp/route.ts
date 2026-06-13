import { NextRequest } from "next/server";
import { createMcpServer, NextJsTransport } from "@/lib/mcp-server";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();
const sessions = new Map<string, NextJsTransport>();

function checkApiKey(request: NextRequest): boolean {
  const expected = process.env.CLAUDE_API_KEY;
  if (!expected) return false;
  const fromHeader = request.headers.get("x-api-key");
  const fromQuery = request.nextUrl.searchParams.get("key");
  return fromHeader === expected || fromQuery === expected;
}

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const transport = new NextJsTransport(controller);
      sessions.set(sessionId, transport);

      const server = createMcpServer();
      server.connect(transport).catch((e: unknown) =>
        console.error("[mcp] connect error:", e)
      );

      // Send endpoint event so the client knows where to POST.
      // Propagate the auth key so the follow-up POST is authorized too.
      const key = request.nextUrl.searchParams.get("key");
      const keyParam = key ? `&key=${encodeURIComponent(key)}` : "";
      controller.enqueue(
        encoder.encode(`event: endpoint\ndata: /api/mcp?sessionId=${sessionId}${keyParam}\n\n`)
      );
    },
    cancel() {
      sessions.delete(sessionId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const transport = sessionId ? sessions.get(sessionId) : null;

  if (!transport) {
    return new Response("Session introuvable", { status: 404 });
  }

  const message = await request.json();
  transport.handleIncoming(message);

  return new Response(null, { status: 202 });
}
