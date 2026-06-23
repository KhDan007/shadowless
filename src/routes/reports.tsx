import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, StatusChip, RiskBadge } from "@/components/sentinel/atoms";
import { Download, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Shadowless" }, { name: "description", content: "Generated investigation reports." }] }),
  component: ReportsPage,
});

const REPORTS = [
  { id: "RPT-2048-014", title: "Case KZ-2048 · Weekly briefing", created: "2026-06-24 09:00", state: "validated", risk: "critical" as const, pages: 18 },
  { id: "RPT-2048-013", title: "Wallet cluster KZ-FIU-118 deep dive", created: "2026-06-23 17:42", state: "validated", risk: "critical" as const, pages: 11 },
  { id: "RPT-2041-007", title: "Cross-border wallet correlation", created: "2026-06-22 14:10", state: "review", risk: "high" as const, pages: 7 },
  { id: "RPT-2036-005", title: "Forum reputation sweep summary", created: "2026-06-20 11:30", state: "review", risk: "medium" as const, pages: 5 },
  { id: "RPT-2029-002", title: "Channel coordination audit", created: "2026-06-18 08:55", state: "archived", risk: "low" as const, pages: 4 },
];

function ReportsPage() {
  return (
    <AppShell>
      <PageShell
        title="Reports"
        subtitle={`${REPORTS.length} generated · auto-bundled per case`}
        actions={
          <button
            onClick={() => toast.success("New report draft created")}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-[#10b981] px-2.5 text-[12px] font-bold text-[#00251a] hover:bg-[#0fcb91]"
          ><Plus size={13} /> New report</button>
        }
      >
        <Panel>
          <PanelHeader title="Generated reports" hint="latest first" />
          <div className="divide-y divide-[#1f2630]">
            {REPORTS.map((r) => (
              <div key={r.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-[#0d1117] text-[#4edea3]"><FileText size={15} /></div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold text-[#e1e2eb]">{r.title}</div>
                  <div className="mono truncate text-[10.5px] text-[#5a6573]">{r.id} · {r.created} · {r.pages} pp</div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge risk={r.risk} />
                  <StatusChip tone={r.state === "validated" ? "good" : r.state === "review" ? "warn" : "neutral"}>{r.state}</StatusChip>
                  <button
                    onClick={() => toast.success(`${r.id} downloaded`)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#bbcabf] hover:border-[#30363d] hover:text-[#4edea3]"
                    aria-label="Download"
                  ><Download size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </PageShell>
    </AppShell>
  );
}