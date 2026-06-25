import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background, Controls, BackgroundVariant, useReactFlow, ReactFlowProvider,
  type Node, type Edge, type NodeProps, Handle, Position, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Send, MessageSquare, Wallet, Phone, MapPin, Database, Layers, Filter, Maximize2,
  Sparkles, Info, Plus, Minus, ChevronDown, RotateCcw, Check, Pin, EyeOff, FileText, X as XIcon, Download,
} from "lucide-react";
import { type EntityKind, type RiskLevel, type SentinelEntity } from "./data";
import { riskMeta } from "./atoms";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LayoutMode } from "./useLayout";
import { LAYOUT_OPTIONS, REGIONS, getLayout, parseLastSeen, type LayoutKind } from "./graphLayouts";
import { useSentinelData } from "./store";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

const KIND_META: Record<EntityKind, { icon: React.ComponentType<any>; tKey: string; color: string }> = {
  suspect:  { icon: User,          tKey: "g.kind.suspect",  color: "var(--kind-suspect)" },
  telegram: { icon: Send,          tKey: "g.kind.telegram", color: "var(--kind-telegram)" },
  forum:    { icon: MessageSquare, tKey: "g.kind.forum",    color: "var(--kind-forum)" },
  wallet:   { icon: Wallet,        tKey: "g.kind.wallet",   color: "var(--kind-wallet)" },
  phone:    { icon: Phone,         tKey: "g.kind.phone",    color: "var(--kind-phone)" },
  location: { icon: MapPin,        tKey: "g.kind.location", color: "var(--kind-location)" },
  osint:    { icon: Database,      tKey: "g.kind.osint",    color: "var(--kind-osint)" },
};

function EntityNode({ data, selected }: NodeProps<{ entity: SentinelEntity; multi?: boolean }>) {
  const { t } = useI18n();
  const e = data.entity;
  const multi = !!data.multi;
  const meta = KIND_META[e.kind];
  const Icon = meta.icon;
  const r = riskMeta[e.risk];
  // Compact "last seen" — strip date + tz, keep HH:MM if present.
  const lastSeenShort = (() => {
    const m = e.lastSeen.match(/(\d{2}:\d{2})/);
    return m ? m[1] : e.lastSeen.slice(-5);
  })();
  return (
    <div
      className={cn(
        "group relative w-[260px] border bg-card transition-all",
        selected
          ? "border-primary pulse-emerald"
          : multi
          ? "border-primary/70 ring-2 ring-primary/30"
          : "border-border hover:border-muted-foreground/30",
      )}
    >
      {/* 4-corner crop marks — case-file frame */}
      <span aria-hidden className="pointer-events-none absolute -left-px -top-px h-2 w-2 border-l border-t border-primary opacity-0 group-hover:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute -right-px -top-px h-2 w-2 border-r border-t border-primary opacity-0 group-hover:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute -left-px -bottom-px h-2 w-2 border-l border-b border-primary opacity-0 group-hover:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute -right-px -bottom-px h-2 w-2 border-r border-b border-primary opacity-0 group-hover:opacity-100" />

      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/30" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/30" />
      <div className="flex items-center gap-2.5 p-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center"
          style={{ background: `${meta.color}1a`, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}
        >
          <Icon size={18} style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: meta.color }}>{t(meta.tKey)}</span>
            <span className={cn("ml-auto h-2 w-2 rounded-full", r.dot)} title={r.label} />
          </div>
          <div className="mono truncate text-[14px] font-semibold text-foreground">{e.label}</div>
        </div>
      </div>
      {/* Confidence bar — etched along the bottom of the head section */}
      <div className="relative h-[4px] border-t border-border bg-background">
        <div
          className="h-full"
          style={{ width: `${e.confidence}%`, background: meta.color, opacity: 0.85 }}
          title={`Confidence ${e.confidence}%`}
        />
      </div>
      {/* Slug + risk strip — always visible, the case-file signature */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-1">
        <span
          className="mono truncate text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground"
          title={`Case-file slug · ${e.id}`}
        >
          {e.id.replace(/^e-/, "SH-2026-").toUpperCase()}
        </span>
        <span className={cn("mono text-[11px]", r.text)} title={`Risk score (0–100): ${r.label}`}>
          R{e.riskScore.toString().padStart(2, "0")}
        </span>
      </div>
      {/* Last-seen ledger row */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-1 text-[11px] text-muted-foreground">
        <span className="mono">last · {lastSeenShort}</span>
        <span className="mono">{e.connections}↔ · conf {e.confidence}%</span>
      </div>
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

const TIME_WINDOWS: { key: "6h" | "24h" | "7d" | "all"; tKey: string; ms: number | null }[] = [
  { key: "6h",  tKey: "g.tw.6h",  ms: 6 * 3600_000 },
  { key: "24h", tKey: "g.tw.24h", ms: 24 * 3600_000 },
  { key: "7d",  tKey: "g.tw.7d",  ms: 7 * 24 * 3600_000 },
  { key: "all", tKey: "g.tw.all", ms: null },
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
  const { t } = useI18n();
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

  // ---------- Multi-select (Shift + click) ----------
  const [multi, setMulti] = useState<Set<string>>(() => new Set());


  // ---------- Context menu (right-click on a node) ----------
  const [ctx, setCtx] = useState<{ x: number; y: number; id: string } | null>(null);
  useEffect(() => {
    if (!ctx) return;
    const close = () => setCtx(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [ctx]);

  // External fit-view request (G shortcut)
  useEffect(() => {
    const fit = () => rf.fitView({ padding: 0.25, duration: 450 });
    window.addEventListener("sentinel:graph-fit", fit);
    return () => window.removeEventListener("sentinel:graph-fit", fit);
  }, [rf]);

  // Clear ephemeral state on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtx(null);
        setMulti(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        data: { entity: e, multi: multi.has(e.id) },
        selected: e.id === selectedId,
        draggable: false,
      })),
    [entitiesAll, visibleIds, positions, selectedId, multi],
  );

  const edges: Edge[] = useMemo(
    () =>
      edgeListLive
        .filter(([s, t, _w, c]) => visibleIds.has(s) && visibleIds.has(t) && c >= confThreshold)
        .map(([s, t, w, c]) => ({
          id: `${s}-${t}`,
          source: s,
          target: t,
          type: "step",
          animated: w === "high",
          label: w === "high" ? `vetted · ${c}%` : w === "med" ? `${c}%` : undefined,
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 0,
          labelBgStyle: { fill: "var(--card)", fillOpacity: 0.92 },
          labelStyle: {
            fill: w === "high" ? "var(--accent-signal)" : "var(--muted-foreground)",
            fontSize: 9.5,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            letterSpacing: "0.06em",
          },
          style: {
            stroke: w === "high" ? "var(--edge-high)" : w === "med" ? "var(--edge-med)" : "var(--edge-low)",
            strokeWidth: w === "high" ? 1.4 : w === "med" ? 1 : 0.75,
            strokeDasharray: w === "low" ? "2 3" : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: w === "high" ? "var(--edge-high)" : w === "med" ? "var(--edge-med)" : "var(--edge-low)",
            width: 12,
            height: 12,
          },
        })),
    [edgeListLive, visibleIds, confThreshold],
  );

  // Refit when layout or filters change
  useEffect(() => {
    const id = window.setTimeout(() => rf.fitView({ padding: 0.25, duration: 500 }), 60);
    return () => window.clearTimeout(id);
  }, [layoutKind, visibleIds, rf]);

  const onNodeClick = useCallback(
    (e: any, n: Node) => {
      if (e?.shiftKey) {
        setMulti((prev) => {
          const next = new Set(prev);
          next.has(n.id) ? next.delete(n.id) : next.add(n.id);
          return next;
        });
        return;
      }
      if (multi.size > 0) setMulti(new Set());
      onSelect(n.id);
    },
    [onSelect, multi.size],
  );

  const onNodeContextMenu = useCallback((e: any, n: Node) => {
    e.preventDefault?.();
    setCtx({ x: e.clientX, y: e.clientY, id: n.id });
  }, []);


  const exportDossier = useCallback(() => {
    const ids = Array.from(multi);
    if (ids.length === 0) return;
    toast.success(`Staged ${ids.length} ${ids.length === 1 ? "entity" : "entities"} for dossier export`);
    try { sessionStorage.setItem("sentinel.pendingDockTab", "evidence"); } catch {}
    const firstId = ids[0];
    onSelect(firstId);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sentinel:open-dossier", { detail: firstId }));
    }, 60);
    setMulti(new Set());
  }, [multi, onSelect]);

  const isMobile = mode === "mobile";
  const showRegions = layoutKind === "geographic";

  return (
    <div className="relative h-full w-full graph-grid">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.8}
        panOnScroll
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--panel-border)" />
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
        <ToolBtn icon={Maximize2} label={t("g.fit")} onClick={() => rf.fitView({ padding: 0.25, duration: 400 })} />
        <span className="mx-0.5 h-4 w-px bg-muted" />
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[12px] text-foreground/80 hover:bg-background hover:text-primary" title={t("g.layout")}>
              <Layers size={12} /> {LAYOUT_OPTIONS.find((l) => l.key === layoutKind)!.label}
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-56 border-border bg-secondary p-1.5">
            <div className="px-2 pb-1 pt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("g.layout.head")}</div>
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
              title={t("g.filter.title")}
            >
              <Filter size={12} /> {t("g.filter")}
              {filtersActive && <span className="mono text-[10px] text-primary">{t("g.filter.on")}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-72 border-border bg-secondary p-3 space-y-3">
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("g.filter.entity_type")}</span>
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
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("g.filter.risk_level")}</span>
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
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("g.filter.min_conf")}</span>
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
                title={t("g.filter.min_conf")}
              />
            </div>

            <div>
              <div className="pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("g.filter.time")}</div>
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
                      title={t(w.tKey)}
                    >
                      {w.key === "all" ? t("g.tw.all") : w.key.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="mono text-[11px] text-muted-foreground">
                {t("g.filter.summary", { v: visibleIds.size, a: entitiesAll.length, l: edges.length })}
              </span>
              <button
                onClick={resetFilters}
                disabled={!filtersActive}
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                  filtersActive ? "text-primary hover:bg-background" : "text-muted-foreground/60",
                )}
              >
                <RotateCcw size={10} /> {t("g.filter.reset")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Slim AI pill */}
      <div className="absolute right-2 top-2 flex flex-col items-end sm:right-3 sm:top-3">
        <button
          onClick={() => setAiOpen((v) => !v)}
          title={t("g.ai.tooltip")}
          className={cn(
            "group inline-flex items-center gap-2 rounded-sm border bg-secondary/95 px-2.5 py-1.5 backdrop-blur transition-colors",
            aiOpen ? "border-primary/60" : "border-border hover:border-muted-foreground/30",
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-primary" />
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
          </span>
          <span className="mono text-[11.5px] font-bold uppercase tracking-wider text-primary">{t("g.ai.label")}</span>
          <span className="text-[12px] font-semibold text-foreground">
            <span className="mono">14</span> <span className="text-foreground/80">{t("g.ai.new")}</span>
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{t("g.ai.head")}</span>
                <span className="mono ml-auto text-[10.5px] text-muted-foreground">v2.4</span>
              </div>
              <div className="mt-2 text-[12px] text-foreground/80">
                Cluster <span className="mono text-foreground">KZ-FIU-118</span> · cross-platform correlation
                <span className="ml-1 mono text-primary" title="Signal strength above baseline noise — 6.2 standard deviations indicates a very strong, statistically reliable match.">+6.2σ</span>
                <div className="mt-2 text-[11.5px] text-muted-foreground">
                  {t("g.ai.body")}
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
              aria-label={t("g.legend")}
            >
              <Info size={12} /> {t("g.legend")}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-60 border-border bg-secondary p-3">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80">{t("g.legend.types")}</div>
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
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80">{t("g.legend.risk")}</div>
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

      {/* Multi-select action bar — appears when Shift+click adds nodes */}
      <AnimatePresence>
        {multi.size > 0 && (
          <motion.div
            key="multi-bar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-sm border border-primary/40 bg-secondary/95 px-2 py-1.5 backdrop-blur shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          >
            <span className="mono text-[11px] font-bold uppercase tracking-wider text-primary">
              {t("g.multi.selected", { n: multi.size })}
            </span>
            <span className="h-4 w-px bg-muted" />
            <button
              onClick={exportDossier}
              className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-primary px-2 text-[12px] font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Download size={12} /> {t("g.multi.export")}
            </button>
            <button
              onClick={() => setMulti(new Set())}
              className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-background px-2 text-[11.5px] text-foreground/80 hover:border-muted-foreground/30 hover:text-foreground"
              title={t("g.multi.clear")}
            >
              <XIcon size={11} /> {t("g.multi.clear")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-click node context menu */}
      <AnimatePresence>
        {ctx && (() => {
          const ent = entitiesAll.find((x) => x.id === ctx.id);
          if (!ent) return null;
          const items = [
            {
              icon: Pin, label: t("g.ctx.pin"),
              onClick: () => toast.success(t("g.toast.pinned", { x: ent.label })),
            },
            {
              icon: EyeOff, label: t("g.ctx.redact"),
              onClick: () => toast(t("g.toast.redacted", { x: ent.label })),
            },
            {
              icon: FileText, label: t("g.ctx.open_dossier"),
              onClick: () => {
                onSelect(ent.id);
                const targetId = ent.id;
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("sentinel:open-dossier", { detail: targetId }));
                }, 60);
                setCtx(null);
              },
            },
            {
              icon: Download, label: t("g.ctx.export_pdf"),
              onClick: () => toast.success(t("g.toast.queued_pdf", { x: ent.label })),
            },
          ];
          return (
            <motion.div
              key={`ctx-${ctx.id}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              style={{ position: "fixed", left: ctx.x, top: ctx.y, zIndex: 60 }}
              className="w-56 rounded border border-border bg-secondary p-1 shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="mono border-b border-border px-2 py-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                {ent.label}
              </div>
              {items.map((it) => (
                <button
                  key={it.label}
                  onClick={() => { it.onClick(); setCtx(null); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12.5px] text-foreground/85 hover:bg-background hover:text-foreground"
                >
                  <it.icon size={12} className="text-primary" /> {it.label}
                </button>
              ))}
            </motion.div>
          );
        })()}
      </AnimatePresence>
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