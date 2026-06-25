import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, StatusChip } from "@/components/sentinel/atoms";
import { FileText, Plus, ChevronRight, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { useSentinelData } from "@/components/sentinel/store";
import { fetchReports, createReport, type ReportRecord } from "@/lib/sentinelApi";
import { exportInvestigationPdf } from "@/lib/exportInvestigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Shadowless" }, { name: "description", content: "Generated investigation reports." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const t = useT();
  const investigationId = useSentinelData((s) => s.investigationId);
  const investigation = useSentinelData((s) => s.investigation);
  const entities = useSentinelData((s) => s.entities);
  const edges = useSentinelData((s) => s.edges);
  const signals = useSentinelData((s) => s.signals);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!investigationId) { setReports([]); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await fetchReports(investigationId);
      setReports(r.reports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [investigationId]);

  useEffect(() => { load(); }, [load]);

  const onCreate = async () => {
    if (!investigationId && entities.length === 0) {
      toast.error(t("page.reports.empty_no_inv") || "Запустите сканирование");
      return;
    }
    setCreating(true);
    try {
      const fname = exportInvestigationPdf({ investigation, entities, edges, signals });
      toast.success(`PDF: ${fname}`);
      if (investigationId) {
        try { await createReport(investigationId); } catch { /* best-effort */ }
        await load();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const onDownload = (r: ReportRecord) => {
    try {
      const fname = exportInvestigationPdf({
        investigation,
        entities,
        edges,
        signals,
        title: r.title || `Report ${r.id.slice(0, 8)}`,
        filename: `${r.id}.pdf`,
      });
      toast.success(fname);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <AppShell>
      <PageShell
        title={t("page.reports.title")}
        subtitle={investigationId ? `${reports.length} ${t("page.reports.sub_count") || "reports"}` : t("page.reports.no_inv") || "No active investigation"}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={!investigationId || loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground disabled:opacity-50"
            ><RefreshCw size={13} className={loading ? "animate-spin" : ""} /> {t("common.refresh") || "Refresh"}</button>
            <button
              onClick={onCreate}
              disabled={!investigationId || creating}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary disabled:opacity-50"
            ><Plus size={13} /> {t("page.reports.new")}</button>
          </div>
        }
      >
        <Panel>
          <PanelHeader title={t("page.reports.list") || "Generated reports"} hint={investigationId ? `inv ${investigationId.slice(0, 8)}` : ""} />
          <div className="divide-y divide-border">
            {investigationId && loading && reports.length === 0 && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-9 w-9 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-56" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
            {!investigationId && (
              <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                {t("page.reports.empty_no_inv") || "Запустите сканирование, чтобы получить отчёты."}
              </div>
            )}
            {investigationId && error && (
              <div className="px-3 py-6 text-center text-[13px] text-destructive">{error}</div>
            )}
            {investigationId && !error && reports.length === 0 && !loading && (
              <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                {t("page.reports.empty") || "Отчётов пока нет. Нажмите «Новый», чтобы создать."}
              </div>
            )}
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
                  <div className="truncate text-[13.5px] font-semibold text-foreground group-hover:text-primary">
                    {r.title || `Report ${r.id.slice(0, 8)}`}
                  </div>
                  <div className="mono truncate text-[11.5px] text-muted-foreground">{r.id} · {r.format?.toUpperCase()} · {r.created_at}</div>
                </Link>
                <div className="flex items-center gap-2">
                  <StatusChip tone={r.status === "ready" || r.status === "done" ? "good" : r.status === "error" ? "bad" : "warn"}>{r.status}</StatusChip>
                  <button
                    onClick={() => onDownload(r)}
                    title="Download PDF"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-border hover:text-primary"
                    aria-label="Download"
                  ><Download size={14} /></button>
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
    </AppShell>
  );
}