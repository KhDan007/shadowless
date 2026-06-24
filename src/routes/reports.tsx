import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, StatusChip, RiskBadge } from "@/components/sentinel/atoms";
import { Download, FileText, Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { REPORTS } from "@/components/sentinel/data";
import { downloadReportPdf } from "@/lib/generateReportPdf";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Shadowless" }, { name: "description", content: "Generated investigation reports." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell>
      <PageShell
        title="Reports"
        subtitle={`${REPORTS.length} generated · auto-bundled per case`}
        actions={
          <button
            onClick={() => toast.success("New report draft created")}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-[#ffb000] px-2.5 text-[13px] font-bold text-[#1a1200] hover:bg-[#ffc94d]"
          ><Plus size={13} /> New report</button>
        }
      >
        <Panel>
          <PanelHeader title="Generated reports" hint="latest first" />
          <div className="divide-y divide-[#1f2630]">
            {REPORTS.map((r) => (
              <div key={r.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 hover:bg-[#0d1117]">
                <Link
                  to="/reports/$id"
                  params={{ id: r.id }}
                  className="flex h-9 w-9 items-center justify-center rounded bg-[#0d1117] text-[#ffc94d] hover:bg-[#2a1f00]"
                  aria-label={`Open ${r.id}`}
                >
                  <FileText size={15} />
                </Link>
                <Link to="/reports/$id" params={{ id: r.id }} className="min-w-0 group">
                  <div className="truncate text-[13.5px] font-semibold text-[#e1e2eb] group-hover:text-[#ffc94d]">{r.title}</div>
                  <div className="mono truncate text-[11.5px] text-[#5a6573]">{r.id} · Case {r.caseId} · {r.created} · {r.pages} pp · {r.author}</div>
                </Link>
                <div className="flex items-center gap-2">
                  <RiskBadge risk={r.risk} />
                  <StatusChip tone={r.state === "validated" ? "good" : r.state === "review" ? "warn" : "neutral"}>{r.state}</StatusChip>
                  <button
                    onClick={() => { downloadReportPdf(r); toast.success(`${r.id} downloaded`); }}
                    title="Download PDF"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#b8b8b8] hover:border-[#30363d] hover:text-[#ffc94d]"
                    aria-label="Download"
                  ><Download size={13} /></button>
                  <Link
                    to="/reports/$id"
                    params={{ id: r.id }}
                    title="Open report"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#b8b8b8] hover:border-[#30363d] hover:text-[#ffc94d]"
                    aria-label="Open"
                  ><ChevronRight size={14} /></Link>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </PageShell>
    </AppShell>
  );
}