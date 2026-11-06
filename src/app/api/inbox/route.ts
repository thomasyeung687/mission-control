import { backend } from "@/lib/backend";
import { handle } from "@/lib/http";
import { buildInbox } from "@/lib/run/inbox";

export function GET() {
  return handle(async () => ({ count: buildInbox(await backend().listRuns()).length }));
}
