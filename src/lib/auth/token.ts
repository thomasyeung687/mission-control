const encoder = new TextEncoder();
export const SESSION_COOKIE = "mc_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(secret: string, nowMs = Date.now()): Promise<string> {
  const expires = Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS;
  return `${expires}.${await hmac(secret, `session:${expires}`)}`;
}

export async function verifySession(
  secret: string,
  token: string | undefined,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) * 1000 < nowMs) return false;
  return constantTimeEqual(signature, await hmac(secret, `session:${expires}`));
}

export async function passwordMatches(expected: string, given: string): Promise<boolean> {
  const salt = "mission-control-password";
  return constantTimeEqual(await hmac(salt, expected), await hmac(salt, given));
}
