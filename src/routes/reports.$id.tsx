import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, StatusChip, MonoKV } from "@/components/sentinel/atoms";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { useSentinelData } from "@/components/sentinel/store";
import { fetchReports, type ReportRecord } from "@/lib/sentinelApi";
import { exportInvestigationPdf } from "@/lib/exportInvestigation";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Report ${params.id.slice(0, 8)} · Shadowless` },
      { name: "description", content: "Investigation report." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const investigationId = useSentinelData((s) => s.investigationId);
  const investigation = useSentinelData((s) => s.investigation);
  const entities = useSentinelData((s) => s.entities);
  const edges = useSentinelData((s) => s.edges);
  const signals = useSentinelData((s) => s.signals);
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!investigationId) { setLoading(false); return; }
      try {
        const r = await fetchReports(investigationId);
        if (cancelled) return;
        const found = (r.reports || []).find((x) => x.id === id) ?? null;
        setReport(found);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [investigationId, id]);

  return (
    <AppShell>
      <PageShell
        title="Отчёт"
        subtitle={id}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                try {
                  const fname = exportInvestigationPdf({
                    investigation, entities, edges, signals,
                    title: report?.title || `Report ${id.slice(0, 8)}`,
                    filename: `${id}.pdf`,
                  });
                  toast.success(fname);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : String(e));
                }
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary"
            ><Download size={13} /> PDF</button>
          <Link
            to="/reports"
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
          ><ArrowLeft size={13} /> Назад</Link>
          </div>
        }
      >
        <div className="mx-auto max-w-3xl">
          <Panel>
            <PanelHeader title="Report metadata" right={<FileText size={12} className="text-muted-foreground" />} />
            {loading && <div className="px-3 py-6 text-[13px] text-muted-foreground">Загрузка…</div>}
            {!loading && error && <div className="px-3 py-6 text-[13px] text-destructive">{error}</div>}
            {!loading && !error && !report && (
              <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                Отчёт не найден на сервере.
              </div>
            )}
            {report && (
              <div className="px-3 py-3 space-y-1">
                <MonoKV k="ID" v={report.id} />
                <MonoKV k="Investigation" v={report.investigation_id} />
                <MonoKV k="Title" v={report.title || "—"} />
                <MonoKV k="Format" v={report.format?.toUpperCase() || "—"} />
                <MonoKV k="Created" v={report.created_at || "—"} />
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[12px] text-muted-foreground">Status</span>
                  <StatusChip tone={report.status === "ready" || report.status === "done" ? "good" : report.status === "error" ? "bad" : "warn"}>{report.status}</StatusChip>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </PageShell>
    </AppShell>
  );
}
