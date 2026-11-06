import { backend } from "@/lib/backend";
import { handle, readJson, type IdParams } from "@/lib/http";
import { parseMessage } from "@/lib/validate";

export function POST(request: Request, { params }: IdParams) {
  return handle(async () => {
    const text = parseMessage(await readJson(request));
    await backend().sendMessage((await params).id, text);
  });
}
