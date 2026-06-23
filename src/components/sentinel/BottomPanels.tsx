import { useMemo, useState } from "react";
import { LOG_ROWS, CONFIDENCE_TREND, ALERTS, ENTITIES, type LogRow, type AlertStatus, type RiskLevel } from "./data";
import { Panel, PanelHeader, RiskBadge, StatusChip } from "./atoms";
import {
  flexRender, getCoreRowModel, useReactTable, createColumnHelper,
} from "@tanstack/react-table";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { AlertTriangle, ArrowUpRight, Brain, Filter, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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
            <button
              onClick={() => toast("Advanced filters coming next sprint")}
              className="ml-1 inline-flex items-center gap-1 rounded-sm border border-[#1f2630] bg-[#0d1117] px-1.5 py-0.5 text-[10px] text-[#bbcabf] hover:border-[#30363d]"
            >
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
              <tr
                key={row.id}
                onClick={() => toast(`Opening ${row.original.id}`)}
                className="group cursor-pointer transition-colors hover:bg-[#1c2128]"
              >
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
          <button
            key={f.t}
            onClick={() => toast.success(`Expanding · ${f.t}`)}
            className="block w-full px-3 py-2 text-left hover:bg-[#0d1117]"
          >
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
          </button>
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
  const [filter, setFilter] = useState<"all" | "unread" | RiskLevel>("all");
  const [acked, setAcked] = useState<Set<string>>(() =>
    new Set(ALERTS.filter((a) => a.status === "acked").map((a) => a.id)),
  );

  const statusOf = (id: string, base: AlertStatus): AlertStatus =>
    acked.has(id) ? "acked" : base;

  const filtered = useMemo(() => {
    return ALERTS.filter((a) => {
      const s = statusOf(a.id, a.status);
      if (filter === "all") return true;
      if (filter === "unread") return s === "unread";
      return a.level === filter;
    });
  }, [filter, acked]);

  const unreadCount = ALERTS.filter((a) => statusOf(a.id, a.status) === "unread").length;

  const ack = (id: string, msg: string) => {
    setAcked((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    toast.success(`Acknowledged · ${msg}`);
  };

  const jump = (entityId: string) => {
    const entity = ENTITIES.find((e) => e.id === entityId);
    if (!entity) return toast.error("Entity not in graph");
    // Light affordance: dispatch a window event index page listens to (kept loosely-coupled).
    window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: entityId }));
    toast(`Focusing ${entity.label}`);
  };

  const FILTERS: { key: typeof filter; label: string; count?: number }[] = [
    { key: "all",      label: "All",      count: ALERTS.length },
    { key: "unread",   label: "Unread",   count: unreadCount },
    { key: "critical", label: "Critical" },
    { key: "high",     label: "High" },
  ];

  const toolbar = (
    <div className="flex items-center gap-1">
      {FILTERS.map((f) => {
        const active = filter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              active ? "bg-[#0f2a22] text-[#4edea3]" : "text-[#5a6573] hover:text-[#bbcabf]",
            )}
          >
            {f.label}
            {f.count != null && (
              <span className={cn("mono text-[9px]", active ? "text-[#4edea3]" : "text-[#5a6573]")}>
                {f.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const list = (
    <div className="min-h-0 flex-1 overflow-auto">
      {filtered.length === 0 ? (
        <div className="px-3 py-6 text-center text-[11px] text-[#5a6573]">No alerts match this filter.</div>
      ) : (
        <ul className="divide-y divide-[#1f2630]">
          {filtered.map((a) => {
            const s = statusOf(a.id, a.status);
            const isUnread = s === "unread";
            const entity = ENTITIES.find((e) => e.id === a.entityId);
            return (
              <li
                key={a.id}
                className={cn(
                  "group grid grid-cols-[auto_1fr_auto] items-start gap-2 px-3 py-2 transition-colors hover:bg-[#0d1117]",
                  isUnread && "bg-[#0f2a22]/15",
                )}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isUnread ? "bg-[#4edea3] shadow-[0_0_6px_#4edea3]" : "bg-[#3c4a42]",
                    )}
                    title={isUnread ? "Unread" : "Acknowledged"}
                  />
                  <span className="mono text-[9.5px] text-[#5a6573]">{a.time}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <RiskBadge risk={a.level} />
                    <span className="mono text-[9.5px] text-[#5a6573]">{a.source}</span>
                    <span className="mono text-[9.5px] text-[#5a6573]">·</span>
                    <span className="mono text-[9.5px] text-[#5a6573]">{a.id}</span>
                  </div>
                  <div className="mt-1 truncate text-[12px] text-[#e1e2eb]">{a.message}</div>
                  {entity && (
                    <button
                      onClick={() => jump(entity.id)}
                      className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-[#bbcabf] hover:text-[#4edea3]"
                    >
                      <ExternalLink size={10} /> {entity.label}
                    </button>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  {isUnread ? (
                    <button
                      onClick={() => ack(a.id, a.message)}
                      title="Acknowledge alert"
                      className="inline-flex h-7 items-center gap-1 rounded-sm border border-[#1f2630] bg-[#0d1117] px-2 text-[10px] font-bold uppercase tracking-wider text-[#bbcabf] hover:border-[#10b981]/60 hover:text-[#4edea3]"
                    >
                      <Check size={11} /> ack
                    </button>
                  ) : (
                    <span className="mono text-[9.5px] text-[#5a6573]">acked</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  if (bare) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#1f2630] bg-[#0d1117] px-3 py-1.5">
          <span className="mono text-[10px] text-[#5a6573]">{filtered.length} of {ALERTS.length} alerts · {unreadCount} unread</span>
          {toolbar}
        </div>
        {list}
      </div>
    );
  }

  return (
    <Panel className="min-h-0 flex-1">
      <PanelHeader
        title="Recent Alerts"
        hint="watchlist"
        right={<StatusChip tone="bad"><AlertTriangle size={10} className="mr-0.5" /> {unreadCount} unread</StatusChip>}
      />
      {toolbar}
      {list}
    </Panel>
  );
}