import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Radio, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { useSentinelData } from "@/components/sentinel/store";
import { fetchSignals, type SignalResponse } from "@/lib/sentinelApi";
import { EvidenceDialog } from "@/components/sentinel/EvidenceDialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/signals")({
  head: () => ({
    meta: [
      { title: "Signals · Shadowless" },
      { name: "description", content: "Operational signals feed across the active investigation." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SignalsPage,
});

type RiskFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW";

function riskClass(r: SignalResponse["risk"]) {
  if (r === "HIGH") return "text-destructive border-destructive/40 bg-destructive/10";
  if (r === "MEDIUM") return "text-[color:var(--risk-medium)] border-[color:var(--risk-medium)]/40 bg-[color:var(--risk-medium)]/10";
  if (r === "LOW") return "text-primary border-primary/40 bg-primary/10";
  return "text-muted-foreground border-border bg-background";
}

function SignalsPage() {
  const { t } = useI18n();
  const investigationId = useSentinelData((s) => s.investigationId);
  const persisted = useSentinelData((s) => s.signals);
  const setSignals = useSentinelData((s) => s.setSignals);
  const [filter, setFilter] = useState<RiskFilter>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);

  const load = async () => {
    if (!investigationId) return;
    setLoading(true); setError(null);
    try {
      const list = await fetchSignals(investigationId);
      setSignals(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [investigationId]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return persisted;
    return persisted.filter((s) => s.risk === filter);
  }, [persisted, filter]);

  const goNode = (s: SignalResponse) => setEvidenceId(s.evidence_id);

  return (
    <AppShell>
      <PageShell
        title={t("signals.title")}
        subtitle={investigationId ? `#${investigationId.slice(0, 8).toUpperCase()}` : t("signals.no_investigation")}
        actions={
          <button
            onClick={() => void load()}
            disabled={!investigationId || loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] font-semibold text-foreground/80 hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <RefreshCw size={12} className={cn(loading && "animate-spin")} /> {t("signals.refresh")}
          </button>
        }
      >
        <div className="flex h-full min-h-[60vh] flex-col gap-3">
          <div className="flex items-center gap-2">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as RiskFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "mono h-7 rounded-sm border px-2 text-[11px] font-bold uppercase tracking-wider",
                  filter === f
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`signals.filter.${f.toLowerCase()}`)}
              </button>
            ))}
            <span className="mono ml-auto text-[11px] text-muted-foreground">
              {t("signals.count", { n: filtered.length })}
            </span>
          </div>

          {!investigationId && (
            <div className="mono flex items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-background py-8 text-[12px] text-muted-foreground">
              <Radio size={12} className="animate-pulse" /> {t("signals.no_investigation")}
            </div>
          )}

          {investigationId && error && (
            <div className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 p-2 text-[12px] text-destructive">
              <AlertTriangle size={12} className="mt-0.5" /> {error}
            </div>
          )}

          {investigationId && !error && filtered.length === 0 && !loading && (
            <div className="mono flex items-center justify-center rounded-sm border border-dashed border-border bg-background py-8 text-[12px] text-muted-foreground">
              {t("signals.empty")}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="overflow-hidden rounded-sm border border-border bg-card">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-background">
                  <tr className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="border-b border-border px-2 py-1.5 text-left">{t("signals.col.time")}</th>
                    <th className="border-b border-border px-2 py-1.5 text-left">{t("signals.col.source")}</th>
                    <th className="border-b border-border px-2 py-1.5 text-left">{t("signals.col.finding")}</th>
                    <th className="border-b border-border px-2 py-1.5 text-right">{t("signals.col.conf")}</th>
                    <th className="border-b border-border px-2 py-1.5 text-center">{t("signals.col.risk")}</th>
                    <th className="border-b border-border px-2 py-1.5 text-left">{t("signals.col.status")}</th>
                    <th className="border-b border-border px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-background/60">
                      <td className="mono px-2 py-1.5 text-[11.5px] text-muted-foreground tabular-nums">{s.time ?? "—"}</td>
                      <td className="mono px-2 py-1.5 text-[11.5px] text-foreground/85">{s.source}</td>
                      <td className="px-2 py-1.5 text-foreground">{s.finding}</td>
                      <td className="mono px-2 py-1.5 text-right tabular-nums text-foreground/85">
                        {s.confidence != null ? `${Math.round(s.confidence)}%` : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={cn("mono inline-block rounded-sm border px-1.5 py-px text-[10px] font-bold uppercase tracking-wider", riskClass(s.risk))}>
                          {s.risk ?? "—"}
                        </span>
                      </td>
                      <td className="mono px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{s.status}</td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => goNode(s)}
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <ExternalLink size={10} /> {s.node_id ? t("signals.open.node") : t("signals.open.evidence")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <EvidenceDialog
          evidenceId={evidenceId}
          open={!!evidenceId}
          onOpenChange={(v) => !v && setEvidenceId(null)}
        />
      </PageShell>
    </AppShell>
  );
}