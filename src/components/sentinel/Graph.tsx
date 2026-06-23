import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background, Controls, BackgroundVariant, useReactFlow, ReactFlowProvider,
  type Node, type Edge, type NodeProps, Handle, Position, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Send, MessageSquare, Wallet, Phone, MapPin, Database, Layers, Filter, Maximize2,
  Sparkles, Info, Plus, Minus, ChevronDown,
} from "lucide-react";
import { ENTITIES, type EntityKind, type SentinelEntity } from "./data";
import { riskMeta } from "./atoms";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LayoutMode } from "./useLayout";

const KIND_META: Record<EntityKind, { icon: React.ComponentType<any>; label: string; color: string }> = {
  suspect:  { icon: User,        label: "Suspect",        color: "#ff5d6c" },
  telegram: { icon: Send,        label: "Telegram",       color: "#6b95e0" },
  forum:    { icon: MessageSquare, label: "Forum",        color: "#b07cf0" },
  wallet:   { icon: Wallet,      label: "Wallet",         color: "#f5b850" },
  phone:    { icon: Phone,       label: "Phone",          color: "#4edea3" },
  location: { icon: MapPin,      label: "Location",       color: "#7da4b8" },
  osint:    { icon: Database,    label: "OSINT Match",    color: "#86948a" },
};

function EntityNode({ data, selected }: NodeProps<{ entity: SentinelEntity }>) {
  const e = data.entity;
  const meta = KIND_META[e.kind];
  const Icon = meta.icon;
  const r = riskMeta[e.risk];
  return (
    <div
      className={cn(
        "group relative w-[188px] rounded border bg-[#161b22] transition-all",
        selected
          ? "border-[#10b981] pulse-emerald"
          : "border-[#262c36] hover:border-[#3c4a42]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-[#3c4a42]" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-[#3c4a42]" />
      <div className="flex items-center gap-2 p-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
          style={{ background: `${meta.color}1a`, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}
        >
          <Icon size={14} style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.1em]" style={{ color: meta.color }}>{meta.label}</span>
            <span className={cn("ml-auto h-1.5 w-1.5 rounded-full", r.dot)} title={r.label} />
          </div>
          <div className="truncate text-[12px] font-semibold text-[#e1e2eb]">{e.label}</div>
        </div>
      </div>
      {/* Secondary metadata: only on hover or when selected */}
      <div className={cn(
        "grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-200",
        (selected || "group-hover:grid-rows-[1fr]"),
        selected && "grid-rows-[1fr]",
      )}>
        <div className="min-h-0">
          <div className="flex items-center justify-between gap-2 border-t border-[#1f2630] px-2 py-1">
            <span className={cn("mono text-[10px]", r.text)}>risk {e.riskScore}</span>
            <span className="mono text-[10px] text-[#5a6573]">{e.confidence}% · {e.connections}↔</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

const layout: Record<string, { x: number; y: number }> = {
  "e-alpha":  { x: 380, y: 200 },
  "e-tg":     { x: 80,  y: 60 },
  "e-forum":  { x: 80,  y: 340 },
  "e-w1":     { x: 700, y: 80 },
  "e-w2":     { x: 720, y: 260 },
  "e-phone":  { x: 700, y: 400 },
  "e-loc":    { x: 380, y: 460 },
  "e-osint":  { x: 80,  y: 220 },
};

const edgeList: [string, string, "high" | "med" | "low"][] = [
  ["e-tg", "e-alpha", "high"],
  ["e-forum", "e-alpha", "med"],
  ["e-osint", "e-alpha", "low"],
  ["e-alpha", "e-w1", "high"],
  ["e-alpha", "e-w2", "med"],
  ["e-alpha", "e-phone", "med"],
  ["e-alpha", "e-loc", "low"],
  ["e-w1", "e-w2", "low"],
  ["e-phone", "e-loc", "low"],
];

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

  const nodes: Node[] = useMemo(
    () =>
      ENTITIES.map((e) => ({
        id: e.id,
        type: "entity",
        position: layout[e.id],
        data: { entity: e },
        selected: e.id === selectedId,
      })),
    [selectedId],
  );

  const edges: Edge[] = useMemo(
    () =>
      edgeList.map(([s, t, w]) => ({
        id: `${s}-${t}`,
        source: s,
        target: t,
        type: "smoothstep",
        animated: w === "high",
        style: {
          stroke: w === "high" ? "#4edea3" : w === "med" ? "#3c4a42" : "#262c36",
          strokeWidth: w === "high" ? 1.6 : 1,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: w === "high" ? "#4edea3" : "#3c4a42" },
      })),
    [],
  );

  const onNodeClick = useCallback((_: any, n: Node) => onSelect(n.id), [onSelect]);

  const isMobile = mode === "mobile";

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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2630" />
        {!isMobile && <Controls position="bottom-right" showInteractive={false} />}
      </ReactFlow>

      {/* Compact toolbar pill */}
      <div className="absolute left-2 top-2 flex items-center gap-0.5 rounded-sm border border-[#1f2630] bg-[#161b22]/95 p-0.5 backdrop-blur sm:left-3 sm:top-3">
        <ToolBtn icon={Maximize2} label="Fit" onClick={() => rf.fitView({ padding: 0.25, duration: 400 })} />
        <span className="mx-0.5 h-4 w-px bg-[#1f2630]" />
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[11px] text-[#bbcabf] hover:bg-[#0d1117] hover:text-[#4edea3]" title="Layout">
              <Layers size={12} /> Layout
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-44 border-[#1f2630] bg-[#161b22] p-1.5">
            <div className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a6573]">Graph layout</div>
            {["Force-directed", "Hierarchical", "Radial", "Grid"].map((l, i) => (
              <button
                key={l}
                onClick={() => rf.fitView({ padding: 0.25, duration: 500 })}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-[11.5px] text-[#bbcabf] hover:bg-[#0d1117] hover:text-[#e1e2eb]"
              >
                {l} {i === 0 && <span className="mono text-[9px] text-[#4edea3]">active</span>}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[11px] text-[#bbcabf] hover:bg-[#0d1117] hover:text-[#4edea3]" title="Filter">
              <Filter size={12} /> Filter
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-52 border-[#1f2630] bg-[#161b22] p-2">
            <div className="pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a6573]">Filter by type</div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(KIND_META).map(([k, m]) => (
                <label key={k} className="flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-1 text-[11px] text-[#bbcabf] hover:bg-[#0d1117]">
                  <input type="checkbox" defaultChecked className="accent-[#10b981]" />
                  {m.label}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Slim AI pill */}
      <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
        <button
          onClick={() => setAiOpen((v) => !v)}
          className={cn(
            "group inline-flex items-center gap-2 rounded-sm border bg-[#161b22]/95 px-2.5 py-1.5 backdrop-blur transition-colors",
            aiOpen ? "border-[#10b981]/60" : "border-[#1f2630] hover:border-[#3c4a42]",
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-[#4edea3]" />
            <span className="absolute inset-0 rounded-full bg-[#4edea3] animate-ping opacity-50" />
          </span>
          <span className="mono text-[10.5px] font-bold uppercase tracking-wider text-[#4edea3]">AI</span>
          <span className="text-[11px] font-semibold text-[#e1e2eb]">
            <span className="mono">14</span> <span className="text-[#bbcabf]">new links</span>
          </span>
          <ChevronDown size={11} className={cn("text-[#5a6573] transition-transform", aiOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-1.5 w-[240px] rounded border border-[#1f2630] bg-[#161b22]/95 p-3 backdrop-blur"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#4edea3]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3]">AI Inference</span>
                <span className="mono ml-auto text-[9.5px] text-[#5a6573]">v2.4</span>
              </div>
              <div className="mt-2 text-[11px] text-[#bbcabf]">
                Cluster <span className="mono text-[#e1e2eb]">KZ-FIU-118</span> · cross-platform correlation
                <span className="ml-1 mono text-[#4edea3]">+6.2σ</span>
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
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-[#1f2630] bg-[#161b22]/95 px-2 text-[11px] text-[#bbcabf] backdrop-blur hover:border-[#3c4a42] hover:text-[#e1e2eb]"
              aria-label="Show legend"
            >
              <Info size={12} /> Legend
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-60 border-[#1f2630] bg-[#161b22] p-3">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#bbcabf]">Entity types</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {Object.entries(KIND_META).map(([k, m]) => {
                const Icon = m.icon;
                return (
                  <div key={k} className="flex items-center gap-1.5 text-[10.5px] text-[#bbcabf]">
                    <Icon size={11} style={{ color: m.color }} />
                    <span>{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="my-2 h-px bg-[#1f2630]" />
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#bbcabf]">Risk levels</div>
            <div className="flex items-center justify-between">
              {(["low", "medium", "high", "critical"] as const).map((r) => (
                <div key={r} className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", riskMeta[r].dot)} />
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#bbcabf]">{r.slice(0, 3)}</span>
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
      className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[11px] text-[#bbcabf] hover:bg-[#0d1117] hover:text-[#4edea3]"
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
      className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#1f2630] bg-[#161b22]/95 text-[#bbcabf] backdrop-blur hover:border-[#3c4a42] hover:text-[#4edea3] active:scale-95"
    >
      <Icon size={16} />
    </button>
  );
}