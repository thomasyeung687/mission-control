import { backend } from "@/lib/backend";
import { handle, type IdParams } from "@/lib/http";

export function GET(_request: Request, { params }: IdParams) {
  return handle(async () => backend().getRun((await params).id));
}
