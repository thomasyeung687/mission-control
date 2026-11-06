import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LoadError } from "@/components/LoadError";
import { RunFilters } from "@/components/runs/RunFilters";
import { RunList } from "@/components/runs/RunList";
import ui from "@/components/ui.module.css";
import { backend } from "@/lib/backend";
import { load } from "@/lib/load";
import { RUN_STATUSES, type RunStatus, type RunSummary } from "@/lib/types";
import { parseRunFilter } from "@/lib/validate";

export const metadata: Metadata = { title: "Runs" };
export const dynamic = "force-dynamic";

function countByStatus(runs: RunSummary[]): Record<RunStatus, number> {
  const counts = Object.fromEntries(RUN_STATUSES.map((s) => [s, 0])) as Record<RunStatus, number>;
  for (const run of runs) counts[run.status] += 1;
  return counts;
}

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filter = parseRunFilter(
    new URLSearchParams(
      Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
    ),
  );
  const result = await load(() =>
    Promise.all([backend().listRuns({ agentId: filter.agentId }), backend().listAgents()]),
  );
  return (
    <div className={ui.page}>
      <div className={ui.pageHeader}>
        <h1>Runs</h1>
        <Link href="/runs/new" className={`${ui.button} ${ui.primary}`}>
          New run
        </Link>
      </div>
      {result.ok ? (
        <>
          <RunFilters agents={result.data[1]} counts={countByStatus(result.data[0])} />
          <RunList
            runs={result.data[0].filter((run) => !filter.status || run.status === filter.status)}
            empty={
              <>
                No runs here yet. <Link href="/runs/new">Start one →</Link>
              </>
            }
          />
          <AutoRefresh />
        </>
      ) : (
        <LoadError error={result.error} />
      )}
    </div>
  );
}
