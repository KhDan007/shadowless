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
            <div className="divide-y divide-[#1f2630]">
              {CASES.map((c) => (
                <Link
                  key={c.id}
                  to="/"
                  className="group flex items-center gap-3 px-3 py-2.5 hover:bg-[#0d1117]"
                >
                  <span className="mono w-20 shrink-0 text-[11px] font-semibold text-[#4edea3]">#{c.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#e1e2eb]">{c.title}</span>
                  <span className="mono hidden text-[10.5px] text-[#5a6573] sm:inline">{c.entities} entities</span>
                  <RiskBadge risk={c.risk} />
                  <ArrowRight size={13} className="text-[#5a6573] group-hover:text-[#4edea3]" />
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
            <div className="divide-y divide-[#1f2630]">
              {[...ENTITIES].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5).map((e) => (
                <Link key={e.id} to="/" className="flex items-center gap-3 px-3 py-2 hover:bg-[#0d1117]">
                  <Activity size={12} className="text-[#4edea3]" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[#e1e2eb]">{e.label}</span>
                  <span className="mono w-8 text-right text-[11px] text-[#bbcabf]">{e.riskScore}</span>
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
  const color = tone === "bad" ? "#ff5d6c" : tone === "warn" ? "#f5b850" : "#4edea3";
  return (
    <div className="rounded border border-[#1f2630] bg-[#161b22] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a6573]">{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="mono mt-1.5 text-[24px] font-bold leading-none text-[#e1e2eb]">{value}</div>
    </div>
  );
}