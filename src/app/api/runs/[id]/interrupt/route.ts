import { backend } from "@/lib/backend";
import { handle, type IdParams } from "@/lib/http";

export function POST(_request: Request, { params }: IdParams) {
  return handle(async () => backend().interrupt((await params).id));
}
