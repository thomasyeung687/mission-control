import type { Metadata } from "next";
import { AgentForm } from "@/components/agents/AgentForm";
import ui from "@/components/ui.module.css";

export const metadata: Metadata = { title: "New agent" };

export default function NewAgentPage() {
  return (
    <div className={ui.page} style={{ maxWidth: 720 }}>
      <div className={ui.pageHeader}>
        <h1>New agent</h1>
      </div>
      <AgentForm />
    </div>
  );
}
