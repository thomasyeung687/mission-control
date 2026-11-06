import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RunChat } from "@/components/chat/RunChat";
import { LoadError } from "@/components/LoadError";
import ui from "@/components/ui.module.css";
import { backend, BackendError, isMockMode } from "@/lib/backend";
import { load } from "@/lib/load";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await load(async () => backend().getRun((await params).id));
  return { title: result.ok ? result.data.title : "Run" };
}

function consoleUrl(id: string): string | null {
  if (isMockMode()) return null;
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID || "default";
  return `https://platform.claude.com/workspaces/${workspace}/sessions/${id}`;
}

export default async function RunPage({ params }: Props) {
  const { id } = await params;
  const result = await load(() => backend().getRun(id));
  if (!result.ok) {
    const status = result.error instanceof BackendError ? result.error.status : 0;
    const apiStatus = (result.error as { status?: number }).status;
    if (status === 404 || apiStatus === 404) notFound();
    return (
      <div className={ui.page}>
        <LoadError error={result.error} />
      </div>
    );
  }
  return <RunChat run={result.data} consoleUrl={consoleUrl(id)} />;
}
