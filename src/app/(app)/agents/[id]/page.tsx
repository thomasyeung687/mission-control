import type { Metadata } from "next";
import { AgentForm } from "@/components/agents/AgentForm";
import { LoadError } from "@/components/LoadError";
import ui from "@/components/ui.module.css";
import { backend } from "@/lib/backend";
import { load } from "@/lib/load";

export const metadata: Metadata = { title: "Edit agent" };
export const dynamic = "force-dynamic";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await load(() => backend().getAgent(id));
  return (
    <div className={ui.page} style={{ maxWidth: 720 }}>
      <div className={ui.pageHeader}>
        <h1>{result.ok ? `Edit ${result.data.name}` : "Edit agent"}</h1>
      </div>
      {result.ok ? <AgentForm agent={result.data} /> : <LoadError error={result.error} />}
    </div>
  );
}
