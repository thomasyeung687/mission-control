import { NextResponse } from "next/server";
import { authSecret } from "@/lib/auth/config";
import {
  passwordMatches,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
} from "@/lib/auth/token";

export async function POST(request: Request) {
  const secret = authSecret();
  const password = process.env.MISSION_CONTROL_PASSWORD;
  if (!secret || !password) {
    return NextResponse.json({ error: "MISSION_CONTROL_PASSWORD is not set" }, { status: 503 });
  }
  const form = await request.formData().catch(() => null);
  const given = form?.get("password");
  if (typeof given !== "string" || !(await passwordMatches(password, given))) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await signSession(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
