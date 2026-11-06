import type { Metadata } from "next";
import Link from "next/link";
import { LoadError } from "@/components/LoadError";
import { NewRunForm } from "@/components/runs/NewRunForm";
import ui from "@/components/ui.module.css";
import { backend } from "@/lib/backend";
import { load } from "@/lib/load";

export const metadata: Metadata = { title: "New run" };
export const dynamic = "force-dynamic";

function suggestedRepos(): string[] {
  const configured = process.env.MISSION_CONTROL_REPOS?.split(",").map((r) => r.trim());
  return configured?.filter(Boolean).length
    ? configured.filter(Boolean)
    : ["thomasyeung687/golf-native"];
}

export default async function NewRunPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const { agent } = await searchParams;
  const result = await load(() => backend().listAgents());
  return (
    <div className={ui.page} style={{ maxWidth: 720 }}>
      <div className={ui.pageHeader}>
        <h1>New run</h1>
      </div>
      {!result.ok ? (
        <LoadError error={result.error} />
      ) : result.data.length ? (
        <NewRunForm agents={result.data} initialAgentId={agent} suggestedRepos={suggestedRepos()} />
      ) : (
        <div className={ui.empty}>
          You need an agent first. <Link href="/agents/new">Create one →</Link>
        </div>
      )}
    </div>
  );
}
