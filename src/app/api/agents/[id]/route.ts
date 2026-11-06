import { backend } from "@/lib/backend";
import { handle, readJson, type IdParams } from "@/lib/http";
import { parseAgentInput } from "@/lib/validate";

export function GET(_request: Request, { params }: IdParams) {
  return handle(async () => backend().getAgent((await params).id));
}

export function PUT(request: Request, { params }: IdParams) {
  return handle(async () => {
    const input = parseAgentInput(await readJson(request));
    return backend().updateAgent((await params).id, input);
  });
}
