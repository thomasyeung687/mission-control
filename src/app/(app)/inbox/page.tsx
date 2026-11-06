import type { Metadata } from "next";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LoadError } from "@/components/LoadError";
import { RunList } from "@/components/runs/RunList";
import ui from "@/components/ui.module.css";
import { backend } from "@/lib/backend";
import { load } from "@/lib/load";
import { buildInbox, type InboxEntry } from "@/lib/run/inbox";

export const metadata: Metadata = { title: "Needs you" };
export const dynamic = "force-dynamic";

function noteFor(entry: InboxEntry): string {
  return entry.reason === "waiting"
    ? "Approve or deny a tool call"
    : "Finished since you last looked";
}

export default async function InboxPage() {
  const result = await load(async () => buildInbox(await backend().listRuns()));
  return (
    <div className={ui.page}>
      <div className={ui.pageHeader}>
        <div>
          <h1>Needs you</h1>
          <p className={ui.subtle}>
            Runs waiting on your approval, and runs that finished since you last opened them.
          </p>
        </div>
      </div>
      {result.ok ? (
        <>
          <RunList
            runs={result.data.map((entry) => entry.run)}
            notes={Object.fromEntries(result.data.map((entry) => [entry.run.id, noteFor(entry)]))}
            empty="All clear. Nothing needs you right now."
          />
          <AutoRefresh />
        </>
      ) : (
        <LoadError error={result.error} />
      )}
    </div>
  );
}
