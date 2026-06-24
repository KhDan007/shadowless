import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { AIFindings, ConfidenceChart } from "@/components/sentinel/BottomPanels";
import { Panel, PanelHeader, StatusChip } from "@/components/sentinel/atoms";
import { Sparkles, Brain } from "lucide-react";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Analysis · Shadowless" }, { name: "description", content: "AI inference, correlations and confidence trends." }] }),
  component: AIPage,
});

function AIPage() {
  return (
    <AppShell>
      <PageShell
        title="AI Analysis"
        subtitle="Inference engine · sentinel-graph-v2.4"
        actions={<StatusChip tone="good"><Brain size={10} className="mr-0.5" /> Online</StatusChip>}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2"><AIFindings /></div>
          <Panel>
            <PanelHeader title="Active models" />
            <div className="divide-y divide-[#1f2630] text-[13px]">
              {[
                { name: "Cluster correlation", v: "v2.4", state: "good", note: "+6.2σ on KZ-FIU-118" },
                { name: "Behavioral profile", v: "v1.8", state: "good", note: "NORDWIND 87% match" },
                { name: "Geo cluster", v: "v1.2", state: "warn", note: "noise spike Almaty perimeter" },
                { name: "OSINT cross-ref", v: "v3.0", state: "good", note: "synthetic-osint-2026Q2" },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-2 px-3 py-2">
                  <Sparkles size={12} className="text-[#ffc94d]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-[#e1e2eb]">{m.name} <span className="mono text-[11px] text-[#5a6573]">{m.v}</span></div>
                    <div className="text-[12px] text-[#b8b8b8]">{m.note}</div>
                  </div>
                  <StatusChip tone={m.state as any}>{m.state === "warn" ? "review" : "live"}</StatusChip>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="mt-3"><ConfidenceChart /></div>
      </PageShell>
    </AppShell>
  );
}