import { NextResponse, type NextRequest } from "next/server";
import { authSecret } from "@/lib/auth/config";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

const PUBLIC_PATHS = ["/login", "/api/login"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  const secret = authSecret();
  const ok = secret
    ? await verifySession(secret, request.cookies.get(SESSION_COOKIE)?.value)
    : false;
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
