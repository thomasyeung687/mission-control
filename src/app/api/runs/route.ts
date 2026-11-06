import type { NextRequest } from "next/server";
import { backend } from "@/lib/backend";
import { handle, readJson } from "@/lib/http";
import { parseNewRun, parseRunFilter } from "@/lib/validate";

export function GET(request: NextRequest) {
  return handle(() => backend().listRuns(parseRunFilter(request.nextUrl.searchParams)));
}

export function POST(request: Request) {
  return handle(async () => {
    const input = parseNewRun(await readJson(request), process.env.GITHUB_DEFAULT_OWNER);
    return backend().createRun(input);
  });
}
