import { useMemo, useState } from "react";
import { LOG_ROWS, CONFIDENCE_TREND, type LogRow } from "./data";
import { Panel, PanelHeader, RiskBadge, StatusChip } from "./atoms";
import {
  flexRender, getCoreRowModel, useReactTable, createColumnHelper,
} from "@tanstack/react-table";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { AlertTriangle, ArrowUpRight, Brain, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const ch = createColumnHelper<LogRow>();
const cols = [
  ch.accessor("time", { header: "Time", cell: (c) => <span className="mono text-[11px] text-[#bbcabf]">{c.getValue()}</span> }),
  ch.accessor("id", { header: "ID", cell: (c) => <span className="mono text-[11px] text-[#5a6573]">{c.getValue()}</span> }),
  ch.accessor("source", { header: "Source", cell: (c) => <span className="mono text-[11px] text-[#e1e2eb]">{c.getValue()}</span> }),
  ch.accessor("entity", { header: "Entity", cell: (c) => <span className="text-[12px] text-[#e1e2eb]">{c.getValue()}</span> }),
  ch.accessor("finding", { header: "Finding", cell: (c) => <span className="text-[12px] text-[#bbcabf]">{c.getValue()}</span> }),
  ch.accessor("confidence", {
    header: "Confidence",
    cell: (c) => {
      const v = c.getValue();
      return (
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-12 overflow-hidden rounded bg-[#0d1117]">
            <div className="h-full" style={{ width: `${v}%`, background: v > 85 ? "#4edea3" : v > 65 ? "#f5b850" : "#86948a" }} />
          </div>
          <span className="mono text-[11px] text-[#e1e2eb] tabular-nums">{v}%</span>
        </div>
      );
    },
  }),
  ch.accessor("risk", { header: "Risk", cell: (c) => <RiskBadge risk={c.getValue()} /> }),
  ch.accessor("status", {
    header: "Status",
    cell: (c) => {
      const v = c.getValue();
      const tone = v === "validated" ? "good" : v === "review" ? "warn" : v === "open" ? "bad" : "neutral";
      return <StatusChip tone={tone as any}>{v}</StatusChip>;
    },
  }),
];

export function EvidenceTable({ bare = false }: { bare?: boolean } = {}) {
  const [filter, setFilter] = useState<"all" | "critical" | "high">("all");
  const data = useMemo(
    () => (filter === "all" ? LOG_ROWS : LOG_ROWS.filter((r) => r.risk === filter)),
    [filter],
  );
  const table = useReactTable({ data, columns: cols, getCoreRowModel: getCoreRowModel() });

  const toolbar = (
          <div className="flex items-center gap-1">
            {(["all", "high", "critical"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  filter === f ? "bg-[#0f2a22] text-[#4edea3]" : "text-[#5a6573] hover:text-[#bbcabf]",
                )}
              >
                {f}
              </button>
            ))}
            <button className="ml-1 inline-flex items-center gap-1 rounded-sm border border-[#1f2630] bg-[#0d1117] px-1.5 py-0.5 text-[10px] text-[#bbcabf] hover:border-[#30363d]">
              <Filter size={10} /> filters
            </button>
          </div>
  );

  const tableBody = (
    <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 bg-[#0d1117] z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border-b border-[#1f2630] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5a6573]"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-[#1c2128]">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-[#1f2630] px-3 py-1.5 align-middle"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );

  if (bare) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#1f2630] bg-[#0d1117] px-3 py-1.5">
          <span className="mono text-[10px] text-[#5a6573]">{data.length} entries · live</span>
          {toolbar}
        </div>
        {tableBody}
      </div>
    );
  }

  return (
    <Panel className="min-h-0 flex-1">
      <PanelHeader title="Evidence & Source Logs" hint={`${data.length} entries · live`} right={toolbar} />
      {tableBody}
    </Panel>
  );
}

export function AIFindings({ bare = false }: { bare?: boolean } = {}) {
  const body = (
    <div className="divide-y divide-[#1f2630]">
        {[
          { t: "Cluster correlation +6.2σ", d: "Wallet TX9z…8kLp linked to 4 inbound counterparties matching cluster KZ-FIU-118.", risk: "critical" as const, time: "14:22" },
          { t: "Behavioral profile match 87%", d: "Entity Alpha posting cadence aligns with Operation NORDWIND fingerprint.", risk: "high" as const, time: "13:58" },
          { t: "Channel admin granted", d: "@shadow_node delegated admin to 2 sub-accounts on 3 broadcast channels.", risk: "high" as const, time: "13:12" },
          { t: "Burner SIM correlation", d: "MNO metadata roaming radius matches geo cluster Almaty Bostandyk.", risk: "medium" as const, time: "11:08" },
        ].map((f) => (
          <div key={f.t} className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-[#e1e2eb]">{f.t}</span>
              <RiskBadge risk={f.risk} />
            </div>
            <p className="mt-0.5 text-[11.5px] leading-snug text-[#bbcabf]">{f.d}</p>
            <div className="mt-1 flex items-center gap-2 mono text-[10px] text-[#5a6573]">
              <span>{f.time}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 text-[#4edea3]">expand <ArrowUpRight size={10} /></span>
            </div>
          </div>
        ))}
    </div>
  );
  if (bare) return body;
  return (
    <Panel>
      <PanelHeader title="AI Findings" hint="last 60 min" right={<StatusChip tone="good"><Brain size={10} className="mr-0.5" /> 14 new</StatusChip>} />
      {body}
    </Panel>
  );
}

export function ConfidenceChart({ bare = false }: { bare?: boolean } = {}) {
  const chart = (
    <div className={cn(bare ? "h-full min-h-[180px]" : "h-[148px]", "px-2 pb-2 pt-1")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CONFIDENCE_TREND}>
            <defs>
              <linearGradient id="gConf" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRisk" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff8a4c" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ff8a4c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2630" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="t" stroke="#5a6573" tickLine={false} axisLine={false} fontSize={10} />
            <YAxis stroke="#5a6573" tickLine={false} axisLine={false} fontSize={10} width={24} />
            <Tooltip
              cursor={{ stroke: "#4edea3", strokeOpacity: 0.3 }}
              contentStyle={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: 4, fontSize: 11, color: "#e1e2eb" }}
              labelStyle={{ color: "#5a6573" }}
            />
            <Area type="monotone" dataKey="conf" stroke="#10b981" strokeWidth={1.4} fill="url(#gConf)" />
            <Area type="monotone" dataKey="risk" stroke="#ff8a4c" strokeWidth={1.4} fill="url(#gRisk)" />
          </AreaChart>
        </ResponsiveContainer>
    </div>
  );
  if (bare) return chart;
  return (
    <Panel>
      <PanelHeader title="Confidence vs Risk" hint="rolling 18-min window" />
      {chart}
    </Panel>
  );
}

export function RecentAlerts({ bare = false }: { bare?: boolean } = {}) {
  const alerts = [
    { t: "14:22", lvl: "critical", m: "Mixer-adjacent transfer on TX9z…8kLp" },
    { t: "13:51", lvl: "high",     m: "Channel cadence sync detected" },
    { t: "11:08", lvl: "medium",   m: "Geo cluster Almaty Bostandyk +3 pings" },
    { t: "09:41", lvl: "high",     m: "Tor forum DarkKaz_204 broker offer" },
  ] as const;
  const body = (
    <div className="divide-y divide-[#1f2630]">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5">
            <span className="mono text-[10px] text-[#5a6573] w-10">{a.t}</span>
            <RiskBadge risk={a.lvl} />
            <span className="text-[11.5px] text-[#e1e2eb] truncate">{a.m}</span>
          </div>
        ))}
    </div>
  );
  if (bare) return body;
  return (
    <Panel>
      <PanelHeader title="Recent Alerts" hint="watchlist" right={<StatusChip tone="bad"><AlertTriangle size={10} className="mr-0.5" /> 3 unread</StatusChip>} />
      {body}
    </Panel>
  );
}