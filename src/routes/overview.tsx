import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { useSentinelData } from "@/components/sentinel/store";
import { Panel, PanelHeader, RiskBadge, StatusChip } from "@/components/sentinel/atoms";
import { Activity, AlertTriangle, Users, FileSearch, Brain } from "lucide-react";
import { fetchStats, type StatsResponse } from "@/lib/sentinelApi";
import { useT } from "@/i18n";

export const Route = createFileRoute("/overview")({
  head: () => ({ meta: [{ title: "Overview · Shadowless" }, { name: "description", content: "Cross-case KPIs and operational status." }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const t = useT();
  const entities = useSentinelData((s) => s.entities);
  const logRows = useSentinelData((s) => s.logRows);
  const investigation = useSentinelData((s) => s.investigation);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchStats().then((s) => { if (!cancelled) setStats(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const criticalCount = entities.filter((e) => e.risk === "critical").length;
  const openLogs = logRows.filter((r) => r.status === "open").length;
  return (
    <AppShell>
      <PageShell
        title={t("page.overview.title")}
        subtitle={t("page.overview.sub")}
        actions={<StatusChip tone="good">{t("page.overview.systems_ok")}</StatusChip>}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Investigations" value={String(stats?.investigations ?? (investigation ? 1 : 0))} icon={FileSearch} />
          <Kpi label="Tracked entities" value={String(stats?.entities_extracted ?? entities.length)} icon={Users} />
          <Kpi label="Open findings" value={String(openLogs)} icon={Brain} tone="warn" />
          <Kpi label="Critical / High" value={String(criticalCount)} icon={AlertTriangle} tone="bad" />
        </div>

        <div className="mt-4">
          <Panel>
            <PanelHeader title="Highest risk entities" hint={entities.length ? `top ${Math.min(8, entities.length)}` : ""} />
            <div className="divide-y divide-border">
              {[...entities].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8).map((e) => (
                <Link key={e.id} to="/workspace" className="flex items-center gap-3 px-3 py-2 hover:bg-background">
                  <Activity size={12} className="text-primary" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{e.label}</span>
                  <span className="mono w-10 text-right text-[12px] text-foreground/80">{e.riskScore}</span>
                  <RiskBadge risk={e.risk} />
                </Link>
              ))}
              {entities.length === 0 && (
                <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                  Запустите сканирование, чтобы появились сущности.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </PageShell>
    </AppShell>
  );
}

function Kpi({ label, value, icon: Icon, tone = "neutral" }: { label: string; value: string; icon: any; tone?: "neutral" | "warn" | "bad" }) {
  const color = tone === "bad" ? "var(--risk-critical)" : tone === "warn" ? "var(--risk-medium)" : "var(--risk-low)";
  return (
    <div className="rounded border border-border bg-secondary p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="mono mt-1.5 text-[24px] font-bold leading-none text-foreground">{value}</div>
    </div>
  );
}