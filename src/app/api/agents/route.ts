import { backend } from "@/lib/backend";
import { handle, readJson } from "@/lib/http";
import { parseAgentInput } from "@/lib/validate";

export function GET() {
  return handle(() => backend().listAgents());
}

export function POST(request: Request) {
  return handle(async () => backend().createAgent(parseAgentInput(await readJson(request))));
}
