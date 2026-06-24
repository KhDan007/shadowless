import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { ENTITIES, CASES, LOG_ROWS } from "@/components/sentinel/data";
import { Panel, PanelHeader, RiskBadge, StatusChip } from "@/components/sentinel/atoms";
import { ConfidenceChart, RecentAlerts } from "@/components/sentinel/BottomPanels";
import { ArrowRight, Activity, AlertTriangle, Users, FileSearch, Brain } from "lucide-react";

export const Route = createFileRoute("/overview")({
  head: () => ({ meta: [{ title: "Overview · Shadowless" }, { name: "description", content: "Cross-case KPIs and operational status." }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const criticalCount = ENTITIES.filter((e) => e.risk === "critical").length;
  const highCount = ENTITIES.filter((e) => e.risk === "high").length;
  const openLogs = LOG_ROWS.filter((r) => r.status === "open").length;
  return (
    <AppShell>
      <PageShell
        title="Operational Overview"
        subtitle="Cross-case posture · last 24h"
        actions={<StatusChip tone="good">All systems nominal</StatusChip>}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Active cases" value={String(CASES.length)} icon={FileSearch} />
          <Kpi label="Tracked entities" value={String(ENTITIES.length)} icon={Users} />
          <Kpi label="Open findings" value={String(openLogs)} icon={Brain} tone="warn" />
          <Kpi label="Critical alerts" value={String(criticalCount)} icon={AlertTriangle} tone="bad" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader title="Active cases" hint={`${CASES.length} total`} />
            <div className="divide-y divide-border">
              {CASES.map((c) => (
                <Link
                  key={c.id}
                  to="/workspace"
                  className="group flex items-center gap-3 px-3 py-2.5 hover:bg-background"
                >
                  <span className="mono w-20 shrink-0 text-[12px] font-semibold text-primary">#{c.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">{c.title}</span>
                  <span className="mono hidden text-[11.5px] text-muted-foreground sm:inline">{c.entities} entities</span>
                  <RiskBadge risk={c.risk} />
                  <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </Panel>
          <RecentAlerts />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ConfidenceChart />
          <Panel>
            <PanelHeader title="Highest risk entities" hint="top 5" />
            <div className="divide-y divide-border">
              {[...ENTITIES].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5).map((e) => (
                <Link key={e.id} to="/workspace" className="flex items-center gap-3 px-3 py-2 hover:bg-background">
                  <Activity size={12} className="text-primary" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{e.label}</span>
                  <span className="mono w-8 text-right text-[12px] text-foreground/80">{e.riskScore}</span>
                  <RiskBadge risk={e.risk} />
                </Link>
              ))}
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