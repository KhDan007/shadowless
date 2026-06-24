import { useMemo, useState } from "react";
import { CONFIDENCE_TREND, ALERTS, ENTITIES, getEvidenceDetail, type LogRow, type AlertStatus, type RiskLevel } from "./data";
import { useSentinelData } from "./store";
import { Panel, PanelHeader, RiskBadge, StatusChip } from "./atoms";
import {
  flexRender, getCoreRowModel, useReactTable, createColumnHelper,
} from "@tanstack/react-table";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { AlertTriangle, ChevronDown, Brain, Filter, Check, ExternalLink, X, FileText, Copy } from "lucide-react";
import { Glossed } from "./Glossary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const ch = createColumnHelper<LogRow>();
const cols = [
  ch.accessor("time", { header: "Time", cell: (c) => <span className="mono text-[12px] text-foreground/80">{c.getValue()}</span> }),
  ch.accessor("id", { header: "ID", cell: (c) => <span className="mono text-[12px] text-muted-foreground">{c.getValue()}</span> }),
  ch.accessor("source", { header: "Source", cell: (c) => <span className="mono text-[12px] text-foreground">{c.getValue()}</span> }),
  ch.accessor("entity", { header: "Entity", cell: (c) => <span className="text-[13px] text-foreground">{c.getValue()}</span> }),
  ch.accessor("finding", { header: "Finding", cell: (c) => <span className="text-[13px] text-foreground/80">{c.getValue()}</span> }),
  ch.accessor("confidence", {
    header: "Confidence",
    cell: (c) => {
      const v = c.getValue();
      return (
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-12 overflow-hidden rounded bg-background">
            <div className="h-full" style={{ width: `${v}%`, background: v > 85 ? "#4ade80" : v > 65 ? "#eab308" : "#8a8170" }} />
          </div>
          <span className="mono text-[12px] text-foreground tabular-nums">{v}%</span>
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
  const [statusFilter, setStatusFilter] = useState<Set<LogRow["status"]>>(new Set(["open", "review", "validated", "archived"]));
  const [sourceFilter, setSourceFilter] = useState<Set<string>>(new Set());
  const [minConf, setMinConf] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const logRows = useSentinelData((s) => s.logRows);
  const allSources = useMemo(() => Array.from(new Set(logRows.map((r) => r.source))).sort(), [logRows]);
  const data = useMemo(
    () => logRows.filter((r) => {
      if (filter !== "all" && r.risk !== filter) return false;
      if (!statusFilter.has(r.status)) return false;
      if (sourceFilter.size > 0 && !sourceFilter.has(r.source)) return false;
      if (r.confidence < minConf) return false;
      return true;
    }),
    [filter, statusFilter, sourceFilter, minConf, logRows],
  );
  const table = useReactTable({ data, columns: cols, getCoreRowModel: getCoreRowModel() });

  const toggleSet = <T,>(s: Set<T>, v: T): Set<T> => {
    const n = new Set(s);
    n.has(v) ? n.delete(v) : n.add(v);
    return n;
  };
  const activeAdvanced = statusFilter.size < 4 || sourceFilter.size > 0 || minConf > 0;
  const resetAdvanced = () => { setStatusFilter(new Set(["open", "review", "validated", "archived"])); setSourceFilter(new Set()); setMinConf(0); };

  const toolbar = (
          <div className="flex items-center gap-1">
            {(["all", "high", "critical"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                  filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                {f}
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "ml-1 inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px]",
                    activeAdvanced
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-background text-foreground/80 hover:border-border",
                  )}
                >
                  <Filter size={10} /> filters{activeAdvanced ? " •" : ""}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 border-border bg-secondary p-3 space-y-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Status</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(["open", "review", "validated", "archived"] as const).map((s) => {
                      const on = statusFilter.has(s);
                      return (
                        <button
                          key={s}
                          onClick={() => setStatusFilter((prev) => toggleSet(prev, s))}
                          className={cn(
                            "rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                            on ? "bg-primary/15 text-primary" : "border border-border text-muted-foreground hover:text-foreground/80",
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Source</div>
                  <div className="mt-1.5 flex max-h-32 flex-wrap gap-1 overflow-auto">
                    {allSources.map((s) => {
                      const on = sourceFilter.has(s);
                      return (
                        <button
                          key={s}
                          onClick={() => setSourceFilter((prev) => toggleSet(prev, s))}
                          className={cn(
                            "mono rounded-sm px-1.5 py-0.5 text-[10.5px]",
                            on ? "bg-primary/15 text-primary" : "border border-border text-foreground/80 hover:text-foreground",
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                    {allSources.length === 0 && <span className="text-[11px] text-muted-foreground">no sources</span>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <span>Min confidence</span>
                    <span className="mono text-primary">{minConf}%</span>
                  </div>
                  <Slider value={[minConf]} onValueChange={(v) => setMinConf(v[0] ?? 0)} max={100} step={5} className="mt-2" />
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <button onClick={resetAdvanced} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">Reset</button>
                  <span className="mono text-[10.5px] text-muted-foreground">{data.length} match</span>
                </div>
              </PopoverContent>
            </Popover>
          </div>
  );

  const tableBody = (
    <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border-b border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
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
                onClick={() => setOpenId(row.original.id)}
                className="group cursor-pointer transition-colors hover:bg-secondary"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-border px-3 py-1.5 align-middle"
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

  const openRow = openId ? data.find((r) => r.id === openId) ?? logRows.find((r) => r.id === openId) ?? null : null;
  const drawer = (
    <Sheet open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
      <SheetContent side="right" className="w-[420px] border-l border-border bg-card p-0 text-foreground sm:max-w-md overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{openRow?.id || "Evidence"}</SheetTitle>
          <SheetDescription>Evidence detail</SheetDescription>
        </SheetHeader>
        {openRow && <EvidenceDrawerBody row={openRow} onClose={() => setOpenId(null)} />}
      </SheetContent>
    </Sheet>
  );

  if (bare) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-background px-3 py-1.5">
          <span className="mono text-[11px] text-muted-foreground">{data.length} entries · live</span>
          {toolbar}
        </div>
        {tableBody}
        {drawer}
      </div>
    );
  }

  return (
    <Panel className="min-h-0 flex-1">
      <PanelHeader title="Evidence & Source Logs" hint={`${data.length} entries · live`} right={toolbar} />
      {tableBody}
      {drawer}
    </Panel>
  );
}

function EvidenceDrawerBody({ row, onClose }: { row: LogRow; onClose: () => void }) {
  const detail = getEvidenceDetail(row.id);
  const copy = (v: string) => { navigator.clipboard?.writeText(v); toast.success("Copied"); };
  const focus = (id: string) => {
    window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: id }));
    onClose();
  };
  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <FileText size={13} className="text-primary" />
            <span className="mono text-[12px] font-bold text-foreground">{row.id}</span>
            <RiskBadge risk={row.risk} />
          </div>
          <Glossed className="mt-1 block text-[13.5px] font-semibold text-foreground">{row.finding}</Glossed>
          <div className="mono mt-0.5 text-[11px] text-muted-foreground">{row.time} · {row.source} · {row.entity}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X size={14} /></button>
      </div>
      <div className="space-y-4 px-4 py-3 text-[12.5px] text-foreground/80">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Confidence" value={`${row.confidence}%`} tone="good" />
          <Stat label="Status" value={row.status} />
          <Stat label="Reliability" value={detail?.reliability ?? "—"} />
          <Stat label="Classification" value={detail?.classification ?? "RESTRICTED // MIA"} />
        </div>
        {detail?.narrative && (
          <Section title="Narrative">
            <p className="leading-snug">{detail.narrative}</p>
          </Section>
        )}
        {detail?.tags?.length ? (
          <Section title="Tags">
            <div className="flex flex-wrap gap-1">
              {detail.tags.map((t) => (
                <span key={t} className="mono rounded-sm bg-secondary px-1.5 py-0.5 text-[10.5px] text-foreground/80">{t}</span>
              ))}
            </div>
          </Section>
        ) : null}
        {detail?.entityIds?.length ? (
          <Section title="Linked entities">
            <div className="flex flex-wrap gap-1">
              {detail.entityIds.map((id) => {
                const ent = ENTITIES.find((e) => e.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => focus(id)}
                    className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 text-[11.5px] text-foreground/80 hover:border-primary/60 hover:text-primary"
                  >
                    <ExternalLink size={10} /> {ent?.label ?? id}
                  </button>
                );
              })}
            </div>
          </Section>
        ) : null}
        {detail?.artifacts?.length ? (
          <Section title={`Artifacts · ${detail.artifacts.length}`}>
            <ul className="space-y-1.5">
              {detail.artifacts.map((a) => (
                <li key={a.filename} className="rounded-sm border border-border bg-background p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono truncate text-[12px] text-foreground">{a.filename}</span>
                    <span className="mono text-[10.5px] text-muted-foreground">{a.sizeKb} KB</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 mono text-[10.5px] text-muted-foreground">
                    <span>{a.kind} · {a.mime}</span>
                    <button onClick={() => copy(a.sha256)} className="inline-flex items-center gap-1 text-foreground/80 hover:text-primary">
                      <Copy size={9} /> {a.sha256}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        {detail?.custody?.length ? (
          <Section title="Chain of custody">
            <ol className="space-y-1.5 border-l border-border pl-3">
              {detail.custody.map((c, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[15px] top-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="mono text-[10.5px] text-muted-foreground">{c.ts} · {c.actor}</div>
                  <div className="text-[12px] text-foreground">{c.action}</div>
                  {c.note && <Glossed className="block text-[11.5px] leading-snug text-foreground/80">{c.note}</Glossed>}
                </li>
              ))}
            </ol>
          </Section>
        ) : null}
        {!detail && (
          <div className="rounded-sm border border-dashed border-border bg-background p-3 text-[12px] text-muted-foreground">
            No extended metadata for this evidence yet. Raw row above is the canonical source.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className="rounded-sm border border-border bg-background p-2">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mono mt-0.5 text-[13px] font-bold", tone === "good" ? "text-primary" : "text-foreground")}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function AIFindings({ bare = false }: { bare?: boolean } = {}) {
  type Finding = {
    t: string; d: string; risk: RiskLevel; time: string;
    source: string; confidence: number; entityIds: string[]; evidenceId?: string;
    rationale: string[];
  };
  const findings: Finding[] = [
    { t: "Cluster correlation +6.2σ", d: "Wallet TX9z…8kLp linked to 4 inbound counterparties matching cluster KZ-FIU-118.", risk: "critical", time: "14:22",
      source: "CHAIN-TRC20 · corr-v4", confidence: 94, entityIds: ["e-w1", "e-alpha"], evidenceId: "EV-2048-029",
      rationale: [
        "4 of 11 inbound counterparties match KZ-FIU-118 within ±48h.",
        "Cluster signature strength is 6.2σ above the 30-day baseline.",
        "Independent vendor attribution agrees on 3 of the 4 addresses.",
      ] },
    { t: "Behavioral profile match 87%", d: "Entity Alpha posting cadence aligns with Operation NORDWIND fingerprint.", risk: "high", time: "13:58",
      source: "OSINT-LAKE · profile-match", confidence: 87, entityIds: ["e-alpha"], evidenceId: "EV-2048-012",
      rationale: [
        "Posting-interval distribution matches archived NORDWIND (KS p=0.02).",
        "Channel rotation cadence matches at 0.87 cosine similarity.",
        "Lexical markers overlap on 6 of 9 anchor phrases.",
      ] },
    { t: "Channel admin granted", d: "@shadow_node delegated admin to 2 sub-accounts on 3 broadcast channels.", risk: "high", time: "13:12",
      source: "TG-CRAWL-04", confidence: 81, entityIds: ["e-tg", "e-alpha"], evidenceId: "EV-2048-007",
      rationale: [
        "Both sub-accounts were created within the past 11 days.",
        "Grant events are synchronized within a 6-minute window.",
        "Pattern matches operational role-distribution playbook.",
      ] },
    { t: "Burner SIM correlation", d: "MNO metadata roaming radius matches geo cluster Almaty Bostandyk.", risk: "medium", time: "11:08",
      source: "MNO-META · GEO-PING", confidence: 69, entityIds: ["e-phone", "e-loc"],
      rationale: [
        "Roaming radius intersects geo cluster with 80m overlap.",
        "3 roaming events fall within the cluster's active window.",
      ] },
  ];
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOpen((prev) => {
    const n = new Set(prev);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });
  const body = (
    <ul className="divide-y divide-border">
      {findings.map((f) => {
        const isOpen = open.has(f.t);
        const entities = f.entityIds
          .map((id) => ENTITIES.find((e) => e.id === id))
          .filter(Boolean) as (typeof ENTITIES)[number][];
        return (
          <li key={f.t}>
            <button
              onClick={() => toggle(f.t)}
              aria-expanded={isOpen}
              className="block w-full px-3 py-2 text-left hover:bg-background"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-foreground">{f.t}</span>
                <div className="flex items-center gap-1.5">
                  <RiskBadge risk={f.risk} />
                  <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-foreground/80">{f.d}</p>
              <div className="mt-1 flex items-center gap-2 mono text-[11px] text-muted-foreground">
                <span>{f.time}</span>
                <span>·</span>
                <span>{f.source}</span>
                <span>·</span>
                <span className="text-primary">{f.confidence}% conf</span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-border bg-background/60 px-3 py-2">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Why the model flagged this</div>
                <ul className="mt-1 space-y-1">
                  {f.rationale.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[12px] text-foreground/80">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {entities.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: ent.id }));
                        toast(`Focusing ${ent.label}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[11px] text-foreground/80 hover:border-primary/50 hover:text-primary"
                    >
                      <ExternalLink size={10} /> {ent.label}
                    </button>
                  ))}
                  {f.evidenceId && (
                    <span className="mono ml-auto text-[10.5px] text-muted-foreground">{f.evidenceId}</span>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
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
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRisk" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2a2723" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="t" stroke="#8a8170" tickLine={false} axisLine={false} fontSize={10} />
            <YAxis stroke="#8a8170" tickLine={false} axisLine={false} fontSize={10} width={24} />
            <Tooltip
              cursor={{ stroke: "#4ade80", strokeOpacity: 0.3 }}
              contentStyle={{ background: "#1c1a15", border: "1px solid #2a2723", borderRadius: 4, fontSize: 11, color: "#e8e2d4" }}
              labelStyle={{ color: "#8a8170" }}
            />
            <Area type="monotone" dataKey="conf" stroke="#22c55e" strokeWidth={1.4} fill="url(#gConf)" />
            <Area type="monotone" dataKey="risk" stroke="#22c55e" strokeWidth={1.4} fill="url(#gRisk)" />
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
              "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
              active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground/80",
            )}
          >
            {f.label}
            {f.count != null && (
              <span className={cn("mono text-[10px]", active ? "text-primary" : "text-muted-foreground")}>
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
        <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">No alerts match this filter.</div>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((a) => {
            const s = statusOf(a.id, a.status);
            const isUnread = s === "unread";
            const entity = ENTITIES.find((e) => e.id === a.entityId);
            return (
              <li
                key={a.id}
                className={cn(
                  "group grid grid-cols-[auto_1fr_auto] items-start gap-2 px-3 py-2 transition-colors hover:bg-background",
                  isUnread && "bg-primary/10",
                )}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isUnread ? "bg-primary " : "bg-muted-foreground/30",
                    )}
                    title={isUnread ? "Unread" : "Acknowledged"}
                  />
                  <span className="mono text-[10.5px] text-muted-foreground">{a.time}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <RiskBadge risk={a.level} />
                    <span className="mono text-[10.5px] text-muted-foreground">{a.source}</span>
                    <span className="mono text-[10.5px] text-muted-foreground">·</span>
                    <span className="mono text-[10.5px] text-muted-foreground">{a.id}</span>
                  </div>
                  <Glossed className="mt-1 block truncate text-[13px] text-foreground">{a.message}</Glossed>
                  {entity && (
                    <button
                      onClick={() => jump(entity.id)}
                      className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-foreground/80 hover:text-primary"
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
                      className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-background px-2 text-[11px] font-bold uppercase tracking-wider text-foreground/80 hover:border-primary/60 hover:text-primary"
                    >
                      <Check size={11} /> ack
                    </button>
                  ) : (
                    <span className="mono text-[10.5px] text-muted-foreground">acked</span>
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
        <div className="flex items-center justify-between border-b border-border bg-background px-3 py-1.5">
          <span className="mono text-[11px] text-muted-foreground">{filtered.length} of {ALERTS.length} alerts · {unreadCount} unread</span>
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