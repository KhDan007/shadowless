import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { AIFindings, ConfidenceChart } from "@/components/sentinel/BottomPanels";
import { Panel, PanelHeader, StatusChip } from "@/components/sentinel/atoms";
import { Sparkles, Brain } from "lucide-react";
import { useT } from "@/i18n";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Analysis · Shadowless" }, { name: "description", content: "AI inference, correlations and confidence trends." }] }),
  component: AIPage,
});

function AIPage() {
  const t = useT();
  return (
    <AppShell>
      <PageShell
        title={t("page.ai.title")}
        subtitle={t("page.ai.sub")}
        actions={<StatusChip tone="good"><Brain size={10} className="mr-0.5" /> {t("page.ai.online")}</StatusChip>}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2"><AIFindings /></div>
          <Panel>
            <PanelHeader title="Active models" />
            <div className="divide-y divide-border text-[13px]">
              {[
                { name: "Cluster correlation", v: "v2.4", state: "good", note: "+6.2σ on KZ-FIU-118" },
                { name: "Behavioral profile", v: "v1.8", state: "good", note: "NORDWIND 87% match" },
                { name: "Geo cluster", v: "v1.2", state: "warn", note: "noise spike Almaty perimeter" },
                { name: "OSINT cross-ref", v: "v3.0", state: "good", note: "synthetic-osint-2026Q2" },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-2 px-3 py-2">
                  <Sparkles size={12} className="text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-foreground">{m.name} <span className="mono text-[11px] text-muted-foreground">{m.v}</span></div>
                    <div className="text-[12px] text-foreground/80">{m.note}</div>
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