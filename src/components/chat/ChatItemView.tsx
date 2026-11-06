import type { ChatItem } from "@/lib/run/chat-items";
import { Markdown } from "./Markdown";
import { ToolCallRow } from "./ToolCallRow";
import styles from "./Chat.module.css";

export function ChatItemView({ item }: { item: ChatItem }) {
  switch (item.kind) {
    case "user":
      return (
        <div className={styles.userRow}>
          <div className={`${styles.user} ${item.queued ? styles.queued : ""}`}>
            <div className={styles.userText}>{item.text}</div>
            {item.queued ? <div className={styles.queuedLabel}>Queued</div> : null}
          </div>
        </div>
      );
    case "agent":
      return (
        <div className={styles.agent}>
          <Markdown text={item.text} />
        </div>
      );
    case "tool":
      return <ToolCallRow tool={item} />;
    case "notice":
      return (
        <div className={`${styles.notice} ${item.tone === "error" ? styles.noticeError : ""}`}>
          {item.text}
        </div>
      );
  }
}

export function PreviewView({ text }: { text: string }) {
  return (
    <div className={`${styles.agent} ${styles.preview}`} aria-live="polite">
      {text ? <Markdown text={text} /> : <span className={styles.typing}>Writing…</span>}
    </div>
  );
}
