import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, StatusChip, RiskBadge } from "@/components/sentinel/atoms";
import { Download, FileText, Plus, ChevronRight, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { downloadReportPdf } from "@/lib/generateReportPdf";
import { NewReportDialog } from "@/components/sentinel/NewReportDialog";
import { useAllReports, useReportsStore } from "@/components/sentinel/reportsStore";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Shadowless" }, { name: "description", content: "Generated investigation reports." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const reports = useAllReports();
  const customIds = useReportsStore((s) => new Set(s.custom.map((r) => r.id)));
  const removeCustom = useReportsStore((s) => s.remove);
  const [openNew, setOpenNew] = useState(false);
  return (
    <AppShell>
      <PageShell
        title="Reports"
        subtitle={`${reports.length} generated · ${customIds.size} drafted by you`}
        actions={
          <button
            onClick={() => setOpenNew(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary"
          ><Plus size={13} /> New report</button>
        }
      >
        <Panel>
          <PanelHeader title="Generated reports" hint="latest first" />
          <div className="divide-y divide-border">
            {reports.map((r) => (
              <div key={r.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 hover:bg-background">
                <Link
                  to="/reports/$id"
                  params={{ id: r.id }}
                  className="flex h-9 w-9 items-center justify-center rounded bg-background text-primary hover:bg-primary/15"
                  aria-label={`Open ${r.id}`}
                >
                  <FileText size={15} />
                </Link>
                <Link to="/reports/$id" params={{ id: r.id }} className="min-w-0 group">
                  <div className="flex items-center gap-2 truncate text-[13.5px] font-semibold text-foreground group-hover:text-primary">
                    {r.title}
                    {customIds.has(r.id) && (
                      <span className="inline-flex items-center gap-1 border border-primary/40 bg-primary/10 px-1 py-px text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary">
                        <Sparkles size={8} /> drafted
                      </span>
                    )}
                  </div>
                  <div className="mono truncate text-[11.5px] text-muted-foreground">{r.id} · Case {r.caseId} · {r.created} · {r.pages} pp · {r.author}</div>
                </Link>
                <div className="flex items-center gap-2">
                  <RiskBadge risk={r.risk} />
                  <StatusChip tone={r.state === "validated" ? "good" : r.state === "review" ? "warn" : "neutral"}>{r.state}</StatusChip>
                  <button
                    onClick={() => { downloadReportPdf(r); toast.success(`${r.id} downloaded`); }}
                    title="Download PDF"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-border hover:text-primary"
                    aria-label="Download"
                  ><Download size={13} /></button>
                  {customIds.has(r.id) && (
                    <button
                      onClick={() => { removeCustom(r.id); toast.success(`${r.id} discarded`); }}
                      title="Discard draft"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-background text-foreground/70 hover:border-destructive/50 hover:text-destructive"
                      aria-label="Discard"
                    ><Trash2 size={13} /></button>
                  )}
                  <Link
                    to="/reports/$id"
                    params={{ id: r.id }}
                    title="Open report"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-border hover:text-primary"
                    aria-label="Open"
                  ><ChevronRight size={14} /></Link>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </PageShell>
      <NewReportDialog open={openNew} onOpenChange={setOpenNew} />
    </AppShell>
  );
}