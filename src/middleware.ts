import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

function pass(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl as NextRequest["nextUrl"] & { method?: string };
  const reqMethod = request.method;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return pass(request);
  }

  // CSRF : les mutations admin doivent venir du même origin
  if (pathname.startsWith("/api/admin/") && reqMethod !== "GET" && reqMethod !== "HEAD") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.endsWith(`//${host}`)) {
      return NextResponse.json({ error: "Origin non autorisé" }, { status: 403 });
    }
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = token ? await verifySessionToken(token) : false;

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return pass(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
