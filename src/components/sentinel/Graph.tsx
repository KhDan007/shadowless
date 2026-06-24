import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background, Controls, BackgroundVariant, useReactFlow, ReactFlowProvider,
  type Node, type Edge, type NodeProps, Handle, Position, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Send, MessageSquare, Wallet, Phone, MapPin, Database, Layers, Filter, Maximize2,
  Sparkles, Info, Plus, Minus, ChevronDown, RotateCcw, Check,
} from "lucide-react";
import { type EntityKind, type RiskLevel, type SentinelEntity } from "./data";
import { riskMeta } from "./atoms";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LayoutMode } from "./useLayout";
import { LAYOUT_OPTIONS, REGIONS, getLayout, parseLastSeen, type LayoutKind } from "./graphLayouts";
import { useSentinelData } from "./store";

const KIND_META: Record<EntityKind, { icon: React.ComponentType<any>; label: string; color: string }> = {
  suspect:  { icon: User,        label: "Suspect",        color: "#dc2626" },
  telegram: { icon: Send,        label: "Telegram",       color: "#a89e8a" },
  forum:    { icon: MessageSquare, label: "Forum",        color: "#166534" },
  wallet:   { icon: Wallet,      label: "Wallet",         color: "#eab308" },
  phone:    { icon: Phone,       label: "Phone",          color: "#4ade80" },
  location: { icon: MapPin,      label: "Location",       color: "#6b6353" },
  osint:    { icon: Database,    label: "OSINT Match",    color: "#8a8170" },
};

function EntityNode({ data, selected }: NodeProps<{ entity: SentinelEntity }>) {
  const e = data.entity;
  const meta = KIND_META[e.kind];
  const Icon = meta.icon;
  const r = riskMeta[e.risk];
  return (
    <div
      className={cn(
        "group relative w-[188px] rounded border bg-secondary transition-all",
        selected
          ? "border-primary pulse-emerald"
          : "border-border hover:border-muted-foreground/30",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/30" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/30" />
      <div className="flex items-center gap-2 p-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
          style={{ background: `${meta.color}1a`, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}
        >
          <Icon size={14} style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: meta.color }}>{meta.label}</span>
            <span className={cn("ml-auto h-1.5 w-1.5 rounded-full", r.dot)} title={r.label} />
          </div>
          <div className="truncate text-[13px] font-semibold text-foreground">{e.label}</div>
        </div>
      </div>
      {/* Secondary metadata: only on hover or when selected */}
      <div className={cn(
        "grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-200",
        (selected || "group-hover:grid-rows-[1fr]"),
        selected && "grid-rows-[1fr]",
      )}>
        <div className="min-h-0">
          <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1">
            <span className={cn("mono text-[11px]", r.text)} title={`Risk score (0–100). Higher means the entity is more likely to be involved in the incident. Current rating: ${r.label}.`}>risk {e.riskScore}</span>
            <span className="mono text-[11px] text-muted-foreground" title={`AI confidence in this entity's identifiers (${e.confidence}%) · connected to ${e.connections} other entities`}>{e.confidence}% · {e.connections}↔</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

const TIME_WINDOWS: { key: "6h" | "24h" | "7d" | "all"; label: string; ms: number | null }[] = [
  { key: "6h",  label: "Last 6h",  ms: 6 * 3600_000 },
  { key: "24h", label: "Last 24h", ms: 24 * 3600_000 },
  { key: "7d",  label: "Last 7d",  ms: 7 * 24 * 3600_000 },
  { key: "all", label: "All time", ms: null },
];

const ALL_KINDS: EntityKind[] = ["suspect", "telegram", "forum", "wallet", "phone", "location", "osint"];
const ALL_RISKS: RiskLevel[] = ["critical", "high", "medium", "low"];

export function Graph({
  selectedId,
  onSelect,
  mode,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  mode: LayoutMode;
}) {
  return (
    <ReactFlowProvider>
      <GraphInner selectedId={selectedId} onSelect={onSelect} mode={mode} />
    </ReactFlowProvider>
  );
}

function GraphInner({
  selectedId,
  onSelect,
  mode,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  mode: LayoutMode;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const rf = useReactFlow();
  const entitiesAll = useSentinelData((s) => s.entities);
  const edgeListLive = useSentinelData((s) => s.edges);
  const latestTs = useMemo(
    () => entitiesAll.reduce((m, e) => Math.max(m, parseLastSeen(e.lastSeen) || 0), 0) || Date.now(),
    [entitiesAll],
  );

  // ---------- Layout state ----------
  const [layoutKind, setLayoutKind] = useState<LayoutKind>("force");

  // ---------- Filter state ----------
  const [kinds, setKinds] = useState<Set<EntityKind>>(() => new Set(ALL_KINDS));
  const [risks, setRisks] = useState<Set<RiskLevel>>(() => new Set(ALL_RISKS));
  const [confThreshold, setConfThreshold] = useState(0);
  const [timeWindow, setTimeWindow] = useState<typeof TIME_WINDOWS[number]["key"]>("all");

  const filtersActive =
    kinds.size !== ALL_KINDS.length ||
    risks.size !== ALL_RISKS.length ||
    confThreshold > 0 ||
    timeWindow !== "all";

  const resetFilters = () => {
    setKinds(new Set(ALL_KINDS));
    setRisks(new Set(ALL_RISKS));
    setConfThreshold(0);
    setTimeWindow("all");
  };

  // ---------- Compute visible nodes/edges ----------
  const positions = useMemo(() => getLayout(layoutKind, entitiesAll, selectedId), [layoutKind, entitiesAll, selectedId]);

  const windowMs = TIME_WINDOWS.find((w) => w.key === timeWindow)?.ms ?? null;

  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    entitiesAll.forEach((e) => {
      if (!kinds.has(e.kind)) return;
      if (!risks.has(e.risk)) return;
      if (e.confidence < confThreshold) return;
      if (windowMs != null) {
        const t = parseLastSeen(e.lastSeen);
        if (t > 0 && latestTs - t > windowMs) return;
      }
      ids.add(e.id);
    });
    return ids;
  }, [entitiesAll, kinds, risks, confThreshold, windowMs, latestTs]);

  const nodes: Node[] = useMemo(
    () =>
      entitiesAll.filter((e) => visibleIds.has(e.id)).map((e) => ({
        id: e.id,
        type: "entity",
        position: positions[e.id] ?? { x: 0, y: 0 },
        data: { entity: e },
        selected: e.id === selectedId,
      })),
    [entitiesAll, visibleIds, positions, selectedId],
  );

  const edges: Edge[] = useMemo(
    () =>
      edgeListLive
        .filter(([s, t, _w, c]) => visibleIds.has(s) && visibleIds.has(t) && c >= confThreshold)
        .map(([s, t, w]) => ({
          id: `${s}-${t}`,
          source: s,
          target: t,
          type: "smoothstep",
          animated: w === "high",
          style: {
            stroke: w === "high" ? "#4ade80" : w === "med" ? "#3a362f" : "#1c1a15",
            strokeWidth: w === "high" ? 1.6 : 1,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: w === "high" ? "#4ade80" : "#3a362f" },
        })),
    [edgeListLive, visibleIds, confThreshold],
  );

  // Refit when layout or filters change
  useEffect(() => {
    const id = window.setTimeout(() => rf.fitView({ padding: 0.25, duration: 500 }), 60);
    return () => window.clearTimeout(id);
  }, [layoutKind, visibleIds, rf]);

  const onNodeClick = useCallback((_: any, n: Node) => onSelect(n.id), [onSelect]);

  const isMobile = mode === "mobile";
  const showRegions = layoutKind === "geographic";

  return (
    <div className="relative h-full w-full graph-grid">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.8}
        panOnScroll
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2723" />
        {!isMobile && <Controls position="bottom-right" showInteractive={false} />}
      </ReactFlow>

      {/* Region labels for geographic layout */}
      {showRegions && (
        <div className="pointer-events-none absolute inset-0">
          {/* deduped region labels */}
          {Array.from(
            new Map(
              Object.values(REGIONS).map((r) => [r.cell, r]),
            ).values(),
          ).map((r) => (
            <span
              key={r.cell}
              className="absolute -translate-x-1/2 mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60"
              style={{ left: r.x + 94, top: r.y - 22 }}
            >
              · {r.label}
            </span>
          ))}
        </div>
      )}

      {/* Compact toolbar pill */}
      <div className="absolute left-2 top-2 flex items-center gap-0.5 rounded-sm border border-border bg-secondary/95 p-0.5 backdrop-blur sm:left-3 sm:top-3">
        <ToolBtn icon={Maximize2} label="Fit" onClick={() => rf.fitView({ padding: 0.25, duration: 400 })} />
        <span className="mx-0.5 h-4 w-px bg-muted" />
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[12px] text-foreground/80 hover:bg-background hover:text-primary" title="Layout">
              <Layers size={12} /> {LAYOUT_OPTIONS.find((l) => l.key === layoutKind)!.label}
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-56 border-border bg-secondary p-1.5">
            <div className="px-2 pb-1 pt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Graph layout</div>
            {LAYOUT_OPTIONS.map((l) => {
              const active = l.key === layoutKind;
              return (
                <button
                  key={l.key}
                  onClick={() => setLayoutKind(l.key)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-sm px-2 py-1.5 text-left",
                    active ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-background hover:text-foreground",
                  )}
                >
                  <div className="flex items-center justify-between text-[12.5px] font-semibold">
                    {l.label}
                    {active && <Check size={11} />}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{l.hint}</span>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "relative inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[12px] hover:bg-background hover:text-primary",
                filtersActive ? "text-primary" : "text-foreground/80",
              )}
              title="Filter graph"
            >
              <Filter size={12} /> Filter
              {filtersActive && <span className="mono text-[10px] text-primary">·on</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-72 border-border bg-secondary p-3 space-y-3">
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Entity type</span>
                <FilterSelectAll
                  all={() => setKinds(new Set(ALL_KINDS))}
                  none={() => setKinds(new Set())}
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                {ALL_KINDS.map((k) => {
                  const m = KIND_META[k];
                  const on = kinds.has(k);
                  return (
                    <label key={k} className={cn("flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-1 text-[12px]", on ? "text-foreground" : "text-muted-foreground")}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          const n = new Set(kinds);
                          on ? n.delete(k) : n.add(k);
                          setKinds(n);
                        }}
                        className="accent-primary"
                      />
                      <m.icon size={10} style={{ color: m.color }} />
                      {m.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Risk level</span>
                <FilterSelectAll
                  all={() => setRisks(new Set(ALL_RISKS))}
                  none={() => setRisks(new Set())}
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                {ALL_RISKS.map((r) => {
                  const m = riskMeta[r];
                  const on = risks.has(r);
                  return (
                    <label key={r} className={cn("flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-1 text-[12px]", on ? "text-foreground" : "text-muted-foreground")}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          const n = new Set(risks);
                          on ? n.delete(r) : n.add(r);
                          setRisks(n);
                        }}
                        className="accent-primary"
                      />
                      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                      {m.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Min confidence</span>
                <span className="mono text-[11px] text-primary">{confThreshold}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
                title="Hide entities and links whose confidence is below this threshold"
              />
            </div>

            <div>
              <div className="pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Time window</div>
              <div className="grid grid-cols-4 gap-1">
                {TIME_WINDOWS.map((w) => {
                  const active = w.key === timeWindow;
                  return (
                    <button
                      key={w.key}
                      onClick={() => setTimeWindow(w.key)}
                      className={cn(
                        "rounded-sm border px-1 py-1 text-[11px] font-semibold",
                        active
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border bg-background text-foreground/80 hover:border-muted-foreground/30",
                      )}
                      title={`Show entities last seen within the ${w.label.toLowerCase()}`}
                    >
                      {w.label.replace("Last ", "")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="mono text-[11px] text-muted-foreground">
                {visibleIds.size}/{entitiesAll.length} entities · {edges.length} links
              </span>
              <button
                onClick={resetFilters}
                disabled={!filtersActive}
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                  filtersActive ? "text-primary hover:bg-background" : "text-muted-foreground/60",
                )}
              >
                <RotateCcw size={10} /> reset
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Slim AI pill */}
      <div className="absolute right-2 top-2 flex flex-col items-end sm:right-3 sm:top-3">
        <button
          onClick={() => setAiOpen((v) => !v)}
          title="AI Inference — model-detected new connections between entities. Click to expand."
          className={cn(
            "group inline-flex items-center gap-2 rounded-sm border bg-secondary/95 px-2.5 py-1.5 backdrop-blur transition-colors",
            aiOpen ? "border-primary/60" : "border-border hover:border-muted-foreground/30",
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-primary" />
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
          </span>
          <span className="mono text-[11.5px] font-bold uppercase tracking-wider text-primary">AI</span>
          <span className="text-[12px] font-semibold text-foreground">
            <span className="mono">14</span> <span className="text-foreground/80">new links</span>
          </span>
          <ChevronDown size={11} className={cn("text-muted-foreground transition-transform", aiOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-full mt-1.5 w-[240px] rounded border border-border bg-secondary/95 p-3 backdrop-blur shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-10"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">AI Inference</span>
                <span className="mono ml-auto text-[10.5px] text-muted-foreground">v2.4</span>
              </div>
              <div className="mt-2 text-[12px] text-foreground/80">
                Cluster <span className="mono text-foreground">KZ-FIU-118</span> · cross-platform correlation
                <span className="ml-1 mono text-primary" title="Signal strength above baseline noise — 6.2 standard deviations indicates a very strong, statistically reliable match.">+6.2σ</span>
                <div className="mt-2 text-[11.5px] text-muted-foreground">
                  The model found 14 likely connections between entities you haven't reviewed yet. Open the AI Findings panel for details.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend (popover only) */}
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-secondary/95 px-2 text-[12px] text-foreground/80 backdrop-blur hover:border-muted-foreground/30 hover:text-foreground"
              aria-label="Show legend"
            >
              <Info size={12} /> Legend
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-60 border-border bg-secondary p-3">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80">Entity types</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {Object.entries(KIND_META).map(([k, m]) => {
                const Icon = m.icon;
                return (
                  <div key={k} className="flex items-center gap-1.5 text-[11.5px] text-foreground/80">
                    <Icon size={11} style={{ color: m.color }} />
                    <span>{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="my-2 h-px bg-muted" />
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80">Risk levels</div>
            <div className="flex items-center justify-between">
              {(["low", "medium", "high", "critical"] as const).map((r) => (
                <div key={r} className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", riskMeta[r].dot)} />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground/80">{r.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile FAB controls */}
      {isMobile && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <FabBtn icon={Plus} onClick={() => rf.zoomIn({ duration: 200 })} label="Zoom in" />
          <FabBtn icon={Minus} onClick={() => rf.zoomOut({ duration: 200 })} label="Zoom out" />
          <FabBtn icon={Maximize2} onClick={() => rf.fitView({ padding: 0.25, duration: 400 })} label="Fit" />
        </div>
      )}
    </div>
  );
}

function ToolBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[12px] text-foreground/80 hover:bg-background hover:text-primary"
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function FabBtn({ icon: Icon, onClick, label }: { icon: any; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded border border-border bg-secondary/95 text-foreground/80 backdrop-blur hover:border-muted-foreground/30 hover:text-primary active:scale-95"
    >
      <Icon size={16} />
    </button>
  );
}

function FilterSelectAll({ all, none }: { all: () => void; none: () => void }) {
  return (
    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
      <button onClick={all} className="text-primary hover:underline">all</button>
      <span className="text-muted-foreground/60">/</span>
      <button onClick={none} className="text-muted-foreground hover:underline">none</button>
    </div>
  );
}