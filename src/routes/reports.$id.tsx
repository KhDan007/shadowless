import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, RiskBadge, StatusChip, MonoKV } from "@/components/sentinel/atoms";
import { ENTITIES, LOG_ROWS, getReportById, type Report } from "@/components/sentinel/data";
import { downloadReportPdf } from "@/lib/generateReportPdf";
import { ArrowLeft, Download, FileText, Printer, ShieldCheck, Users, FileSearch } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/$id")({
  head: ({ params }) => {
    const r = getReportById(params.id);
    const title = r ? `${r.title} · Shadowless` : "Report · Shadowless";
    const description = r?.summary ?? "Investigative briefing.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  loader: ({ params }) => {
    const report = getReportById(params.id);
    if (!report) throw notFound();
    return { report };
  },
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <PageShell title="Report unavailable" subtitle={String(error)}>
        <button onClick={reset} className="rounded-sm bg-primary px-3 py-1.5 text-[13px] font-bold text-primary-foreground">Retry</button>
      </PageShell>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <PageShell title="Report not found" subtitle="The requested briefing does not exist or has been archived out of scope.">
        <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[13px] font-bold text-primary-foreground">
          <ArrowLeft size={13} /> Back to reports
        </Link>
      </PageShell>
    </AppShell>
  ),
  component: ReportDetail,
});

function ReportDetail() {
  const { report } = Route.useLoaderData();
  const r = report as Report;
  const linkedEntities = ENTITIES.filter((e) => r.entityIds.includes(e.id));
  const linkedEvidence = LOG_ROWS.filter((row) => r.evidenceIds.includes(row.id));

  return (
    <AppShell>
      <PageShell
        title="Report"
        subtitle={`${r.id} · Case ${r.caseId}`}
        actions={
          <>
            <Link
              to="/reports"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
            >
              <ArrowLeft size={13} /> Reports
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
              title="Print or save via browser"
            >
              <Printer size={13} /> Print
            </button>
            <button
              onClick={() => { downloadReportPdf(r); toast.success(`${r.id} downloaded`); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary"
              title="Generate and download PDF"
            >
              <Download size={13} /> Download PDF
            </button>
          </>
        }
      >
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Hero */}
          <div className="relative overflow-hidden rounded border border-border bg-gradient-to-br from-background via-card to-primary/15 p-5">
            <div className="absolute right-0 top-0 h-full w-1.5 bg-primary" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{r.classification}</span>
              <span className="mono text-[11px] text-muted-foreground">·</span>
              <RiskBadge risk={r.risk} />
              <StatusChip tone={r.state === "validated" ? "good" : r.state === "review" ? "warn" : "neutral"}>{r.state}</StatusChip>
              <span className="ml-auto mono text-[11.5px] text-muted-foreground">{r.id}</span>
            </div>
            <h1 className="mt-3 text-[22px] font-bold leading-tight text-foreground">{r.title}</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-foreground/80">{r.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] sm:grid-cols-4">
              <Meta label="Case"      value={`#${r.caseId}`} />
              <Meta label="Created"   value={r.created} />
              <Meta label="Author"    value={r.author} />
              <Meta label="Pages"     value={String(r.pages)} />
            </div>
          </div>

          {/* Body grid */}
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              {r.sections.map((s, i) => (
                <Panel key={i}>
                  <PanelHeader title={s.heading} hint={`§${i + 1}`} />
                  <p className="px-4 py-3 text-[13.5px] leading-relaxed text-foreground/80">{s.body}</p>
                </Panel>
              ))}

              {linkedEvidence.length > 0 && (
                <Panel>
                  <PanelHeader title="Linked evidence" hint={`${linkedEvidence.length} items`} right={<FileSearch size={11} className="text-muted-foreground" />} />
                  <div className="divide-y divide-border">
                    {linkedEvidence.map((ev) => (
                      <div key={ev.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2">
                        <span className="mono text-[11.5px] text-muted-foreground">{ev.id}</span>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] text-foreground">{ev.finding}</div>
                          <div className="mono truncate text-[11px] text-muted-foreground">{ev.time} · {ev.source} · {ev.entity}</div>
                        </div>
                        <RiskBadge risk={ev.risk} />
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>

            <aside className="space-y-3">
              <Panel>
                <PanelHeader title="Metadata" right={<ShieldCheck size={11} className="text-primary" />} />
                <div className="px-3 py-2">
                  <MonoKV k="Report ID" v={r.id} />
                  <MonoKV k="Case ID"   v={`#${r.caseId}`} />
                  <MonoKV k="Created"   v={r.created} />
                  <MonoKV k="State"     v={r.state.toUpperCase()} />
                  <MonoKV k="Risk"      v={r.risk.toUpperCase()} />
                  <MonoKV k="Pages"     v={String(r.pages)} />
                  <MonoKV k="Author"    v={r.author} />
                </div>
              </Panel>

              {linkedEntities.length > 0 && (
                <Panel>
                  <PanelHeader title="Linked entities" hint={`${linkedEntities.length}`} right={<Users size={11} className="text-muted-foreground" />} />
                  <ul className="divide-y divide-border">
                    {linkedEntities.map((e) => (
                      <li key={e.id} className="flex items-center gap-2 px-3 py-2">
                        <span className="mono text-[11px] text-muted-foreground w-12">{e.id}</span>
                        <span className="truncate text-[13px] text-foreground flex-1">{e.label}</span>
                        <RiskBadge risk={e.risk} />
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              <Panel>
                <PanelHeader title="Export" right={<FileText size={11} className="text-muted-foreground" />} />
                <div className="space-y-2 px-3 py-3">
                  <button
                    onClick={() => { downloadReportPdf(r); toast.success(`${r.id} downloaded`); }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground hover:bg-primary"
                  >
                    <Download size={13} /> Download as PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
                  >
                    <Printer size={13} /> Print / browser save
                  </button>
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    PDF is generated client-side and preserves classification, risk band, and all sections.
                  </p>
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      </PageShell>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mono mt-0.5 truncate text-[12.5px] text-foreground">{value}</div>
    </div>
  );
}