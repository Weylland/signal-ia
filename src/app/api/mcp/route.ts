import { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";

export const dynamic = "force-dynamic";

function checkApiKey(request: NextRequest): boolean {
  const expected = process.env.CLAUDE_API_KEY;
  if (!expected) return false;
  const fromHeader = request.headers.get("x-api-key");
  const fromQuery = request.nextUrl.searchParams.get("key");
  return fromHeader === expected || fromQuery === expected;
}

// Transport Streamable HTTP en mode stateless : chaque requête est autonome
// (un serveur + un transport neufs), donc rien à garder en mémoire entre les
// appels. Survit aux redéploiements et permet de passer la clé en header.
async function handle(request: NextRequest): Promise<Response> {
  if (!checkApiKey(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  const response = await transport.handleRequest(request);
  await server.close();
  return response;
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
