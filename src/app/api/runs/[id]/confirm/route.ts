import { backend } from "@/lib/backend";
import { handle, readJson, type IdParams } from "@/lib/http";
import { parseConfirmation } from "@/lib/validate";

export function POST(request: Request, { params }: IdParams) {
  return handle(async () => {
    const { toolUseId, allow, denyMessage } = parseConfirmation(await readJson(request));
    await backend().confirmTool((await params).id, toolUseId, allow, denyMessage || undefined);
  });
}
