import { backend, type LiveStream } from "@/lib/backend";
import { errorResponse, type IdParams } from "@/lib/http";
import { consolidate, isTerminal } from "@/lib/run/reconnect";

export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 15_000;
const encoder = new TextEncoder();

export async function GET(request: Request, { params }: IdParams) {
  const { id } = await params;
  const source = backend();
  let live: LiveStream;
  try {
    live = await source.openStream(id);
  } catch (error) {
    return errorResponse(error);
  }
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
      request.signal.addEventListener("abort", () => live.close());
      send("retry: 2000\n\n");
      try {
        for await (const event of consolidate(live, () => source.listEvents(id))) {
          send(`data: ${JSON.stringify(event)}\n\n`);
          if (isTerminal(event)) send("event: end\ndata: {}\n\n");
        }
      } catch (error) {
        if (!request.signal.aborted) console.error("run stream failed", error);
      } finally {
        clearInterval(heartbeat);
        live.close();
        try {
          controller.close();
        } catch {
          // The client already went away.
        }
      }
    },
    cancel: () => live.close(),
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
