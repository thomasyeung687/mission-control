import type { Metadata } from "next";
import Link from "next/link";
import { AgentList } from "@/components/agents/AgentList";
import { LoadError } from "@/components/LoadError";
import ui from "@/components/ui.module.css";
import { backend } from "@/lib/backend";
import { load } from "@/lib/load";

export const metadata: Metadata = { title: "Agents" };
export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const result = await load(() => backend().listAgents());
  return (
    <div className={ui.page}>
      <div className={ui.pageHeader}>
        <h1>Agents</h1>
        <Link href="/agents/new" className={`${ui.button} ${ui.primary}`}>
          New agent
        </Link>
      </div>
      {!result.ok ? (
        <LoadError error={result.error} />
      ) : result.data.length ? (
        <AgentList agents={result.data} />
      ) : (
        <div className={ui.empty}>
          No agents yet. <Link href="/agents/new">Create your first one →</Link>
        </div>
      )}
    </div>
  );
}
