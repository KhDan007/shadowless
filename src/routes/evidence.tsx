import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { EvidenceView } from "@/components/sentinel/EvidenceView";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n";
import { useSentinelData } from "@/components/sentinel/store";
import { exportSignalsCsv } from "@/lib/exportInvestigation";

export const Route = createFileRoute("/evidence")({
  validateSearch: (search: Record<string, unknown>) => ({
    evidence: typeof search.evidence === "string" ? search.evidence : undefined,
  }),
  head: () => ({ meta: [{ title: "Evidence · Shadowless" }, { name: "description", content: "All evidence and source logs." }] }),
  component: EvidencePage,
});

function EvidencePage() {
  const t = useT();
  const { evidence } = Route.useSearch();
  const signals = useSentinelData((s) => s.signals);
  const logRows = useSentinelData((s) => s.logRows);
  return (
    <AppShell>
      <PageShell
        title={t("page.evidence.title")}
        subtitle={t("page.evidence.sub")}
        actions={
          <button
            onClick={() => {
              if (!signals.length && !logRows.length) {
                toast.error(t("page.reports.empty_no_inv") || "Нет данных для экспорта");
                return;
              }
              try {
                const fname = exportSignalsCsv(signals, logRows);
                toast.success(fname);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : String(e));
              }
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] font-semibold text-foreground/80 hover:border-border hover:text-foreground"
          ><Download size={13} /> {t("page.evidence.export")}</button>
        }
      >
        <div className="flex h-full min-h-[70vh] flex-col">
          <EvidenceView highlightedId={evidence} />
        </div>
      </PageShell>
    </AppShell>
  );
}