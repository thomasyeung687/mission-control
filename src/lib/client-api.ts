export async function sendJson<T = unknown>(
  url: string,
  body?: unknown,
  method: "POST" | "PUT" = "POST",
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (response.status === 401)
    throw new Error("Your login expired. Reload the page to sign in again.");
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
  return data as T;
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
