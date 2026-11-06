import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { ValidationError } from "@/lib/validate";

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof BackendError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 502;
    return NextResponse.json({ error: error.message }, { status: status >= 400 ? status : 502 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

export async function handle<T>(work: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await work();
    return NextResponse.json(result ?? { ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Body must be JSON");
  }
}

export interface IdParams {
  params: Promise<{ id: string }>;
}
