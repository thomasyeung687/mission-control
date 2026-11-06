"use client";

import { useEffect } from "react";
import { chatItems, pendingConfirmations } from "@/lib/run/reducer";
import type { RunSummary } from "@/lib/types";
import { ApprovalCard } from "./ApprovalCard";
import { ChatItemView, PreviewView } from "./ChatItemView";
import { Composer } from "./Composer";
import { RunHeader } from "./RunHeader";
import { useRunStream } from "./useRunStream";
import { useStickToBottom } from "./useStickToBottom";
import styles from "./Chat.module.css";

function composerBlock(status: RunSummary["status"]): string | null {
  if (status === "ended") return "This run has ended";
  if (status === "waiting") return "Answer the approval above first";
  return null;
}

function useMarkSeen(runId: string, status: RunSummary["status"]) {
  useEffect(() => {
    if (status === "idle" || status === "ended") {
      void fetch(`/api/runs/${runId}/seen`, { method: "POST" }).catch(() => undefined);
    }
  }, [runId, status]);
}

export function RunChat({ run, consoleUrl }: { run: RunSummary; consoleUrl: string | null }) {
  const { state, connection } = useRunStream(run.id);
  const status = state.status ?? run.status;
  const items = chatItems(state);
  const previews = Object.entries(state.previews);
  const approvals = pendingConfirmations(state);
  const scrollRef = useStickToBottom([items.length, previews.map(([, t]) => t.length).join()]);
  useMarkSeen(run.id, status);

  return (
    <div className={styles.chat}>
      <RunHeader run={run} status={status} connection={connection} consoleUrl={consoleUrl} />
      <div className={styles.scroll} ref={scrollRef}>
        <div className={styles.thread}>
          {items.map((item) => (
            <ChatItemView key={item.id} item={item} />
          ))}
          {previews.map(([id, text]) => (
            <PreviewView key={id} text={text} />
          ))}
          {status === "running" && !previews.length ? (
            <div className={styles.working}>Working…</div>
          ) : null}
          {connection === "connecting" && !items.length ? (
            <div className={styles.working}>Loading…</div>
          ) : null}
        </div>
      </div>
      <div className={styles.footer}>
        {approvals.map((tool) => (
          <ApprovalCard key={tool.id} runId={run.id} tool={tool} />
        ))}
        <Composer runId={run.id} disabledReason={composerBlock(status)} />
      </div>
    </div>
  );
}
