"use client";

import { useEffect, useReducer, useState } from "react";
import { chatReducer, initialChatState } from "@/lib/run/reducer";
import type { StreamEvent } from "@/lib/types";

export type Connection = "connecting" | "live" | "reconnecting" | "closed";

const RETRY_MS = 3000;

export function useRunStream(runId: string) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const [connection, setConnection] = useState<Connection>("connecting");

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const connect = () => {
      source = new EventSource(`/api/runs/${runId}/stream`);
      source.onopen = () => setConnection("live");
      source.onmessage = (message: MessageEvent<string>) => {
        dispatch(JSON.parse(message.data) as StreamEvent);
      };
      source.addEventListener("end", () => {
        finished = true;
        source?.close();
        setConnection("closed");
      });
      source.onerror = () => {
        if (finished) return;
        setConnection("reconnecting");
        if (source?.readyState === EventSource.CLOSED) {
          retry = setTimeout(connect, RETRY_MS);
        }
      };
    };

    connect();
    return () => {
      finished = true;
      clearTimeout(retry);
      source?.close();
    };
  }, [runId]);

  return { state, connection };
}
