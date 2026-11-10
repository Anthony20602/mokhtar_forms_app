import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, verifyPrintToken, verifySessionToken } from "@/backend/auth/auth";

// Password gate (only active when APP_PASSWORD is set).
export function proxy(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname, searchParams } = request.nextUrl;
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  // The server's headless browser rendering a PDF of one document.
  const print = /^\/documents\/(\d+)\/print$/.exec(pathname);
  if (print && verifyPrintToken(Number(print[1]), searchParams.get("pt"))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except Next's own assets and the static files in /public.
  matcher: ["/((?!_next/static|_next/image|templates/|logo\\.png|icon\\.png|manifest\\.webmanifest).*)"],
};
