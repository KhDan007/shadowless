import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, RiskBadge, StatusChip, MonoKV } from "@/components/sentinel/atoms";
import { ENTITIES, LOG_ROWS, type Report } from "@/components/sentinel/data";
import { useAllReports } from "@/components/sentinel/reportsStore";
import { getReport } from "@/components/sentinel/reportsStore";
import { downloadReportPdf } from "@/lib/generateReportPdf";
import { ArrowLeft, Download, FileText, Printer, ShieldCheck, Users, FileSearch, FileBadge } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { DICT } from "@/i18n/dict";

const tStatic = (key: string, vars?: Record<string, string | number>): string => {
  let s = DICT.ru[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
};

export const Route = createFileRoute("/reports/$id")({
  head: ({ params }) => {
    const r = getReport(params.id);
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
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <PageShell title={tStatic("rep.detail.unavailable")} subtitle={String(error)}>
        <button onClick={reset} className="rounded-sm bg-primary px-3 py-1.5 text-[13px] font-bold text-primary-foreground">{tStatic("rep.detail.retry")}</button>
      </PageShell>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <PageShell title={tStatic("rep.detail.not_found")} subtitle={tStatic("rep.detail.not_found_sub")}>
        <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[13px] font-bold text-primary-foreground">
          <ArrowLeft size={13} /> {tStatic("rep.detail.back_to")}
        </Link>
      </PageShell>
    </AppShell>
  ),
  component: ReportDetail,
});

function ReportDetail() {
  const { t } = useI18n();
  const { id } = Route.useParams();
  const reports = useAllReports();
  const r = reports.find((x) => x.id === id) as Report | undefined;
  if (!r) {
    return (
      <AppShell>
        <PageShell title={t("rep.detail.not_found")} subtitle={t("rep.detail.not_found_id", { id })}>
          <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[13px] font-bold text-primary-foreground">
            <ArrowLeft size={13} /> {t("rep.detail.back_to")}
          </Link>
        </PageShell>
      </AppShell>
    );
  }
  const linkedEntities = ENTITIES.filter((e) => r.entityIds.includes(e.id));
  const linkedEvidence = LOG_ROWS.filter((row) => r.evidenceIds.includes(row.id));

  return (
    <AppShell>
      <PageShell
        title={t("rep.detail.report")}
        subtitle={t("rep.detail.case", { id: r.id, c: r.caseId })}
        actions={
          <>
            <Link
              to="/reports"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
            >
              <ArrowLeft size={13} /> {t("rep.detail.back")}
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
              title={t("rep.detail.print_title")}
            >
              <Printer size={13} /> {t("rep.detail.print")}
            </button>
            <Link
              to="/dossier/$id"
              params={{ id: r.id }}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-primary/60 bg-primary/15 px-2.5 text-[13px] font-bold text-primary hover:bg-primary/20"
              title={t("rep.detail.dossier_title")}
            >
              <FileBadge size={13} /> {t("rep.detail.dossier")}
            </Link>
            <button
              onClick={() => { downloadReportPdf(r); toast.success(t("rep.detail.downloaded", { id: r.id })); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary"
              title={t("rep.detail.download_title")}
            >
              <Download size={13} /> {t("rep.detail.download")}
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
              <Meta label={t("rep.detail.meta.case")}    value={`#${r.caseId}`} />
              <Meta label={t("rep.detail.meta.created")} value={r.created} />
              <Meta label={t("rep.detail.meta.author")}  value={r.author} />
              <Meta label={t("rep.detail.meta.pages")}   value={String(r.pages)} />
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
                  <PanelHeader title={t("rep.detail.linked_evidence")} hint={t("rep.detail.items_n", { n: linkedEvidence.length })} right={<FileSearch size={11} className="text-muted-foreground" />} />
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
                <PanelHeader title={t("rep.detail.metadata")} right={<ShieldCheck size={11} className="text-primary" />} />
                <div className="px-3 py-2">
                  <MonoKV k={t("rep.detail.report_id")} v={r.id} />
                  <MonoKV k={t("rep.detail.case_id")}   v={`#${r.caseId}`} />
                  <MonoKV k={t("rep.detail.meta.created")} v={r.created} />
                  <MonoKV k={t("rep.detail.state")}     v={r.state.toUpperCase()} />
                  <MonoKV k={t("rep.detail.risk")}      v={r.risk.toUpperCase()} />
                  <MonoKV k={t("rep.detail.meta.pages")} v={String(r.pages)} />
                  <MonoKV k={t("rep.detail.meta.author")} v={r.author} />
                </div>
              </Panel>

              {linkedEntities.length > 0 && (
                <Panel>
                  <PanelHeader title={t("rep.detail.linked_entities")} hint={`${linkedEntities.length}`} right={<Users size={11} className="text-muted-foreground" />} />
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
                <PanelHeader title={t("rep.detail.export")} right={<FileText size={11} className="text-muted-foreground" />} />
                <div className="space-y-2 px-3 py-3">
                  <button
                    onClick={() => { downloadReportPdf(r); toast.success(t("rep.detail.downloaded", { id: r.id })); }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground hover:bg-primary"
                  >
                    <Download size={13} /> {t("rep.detail.download_pdf")}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 text-[13px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
                  >
                    <Printer size={13} /> {t("rep.detail.print_save")}
                  </button>
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    {t("rep.detail.pdf_note")}
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