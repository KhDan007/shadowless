import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background, Controls, BackgroundVariant,
  type Node, type Edge, type NodeProps, Handle, Position, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import {
  User, Send, MessageSquare, Wallet, Phone, MapPin, Database, Layers, Filter, Maximize2,
  Sparkles,
} from "lucide-react";
import { ENTITIES, type EntityKind, type SentinelEntity } from "./data";
import { riskMeta } from "./atoms";
import { cn } from "@/lib/utils";

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
        "group relative w-[208px] rounded border bg-[#161b22] transition-all",
        selected
          ? "border-[#10b981] pulse-emerald"
          : "border-[#262c36] hover:border-[#3c4a42]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-[#3c4a42]" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-[#3c4a42]" />
      <div className="flex items-start gap-2 p-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
          style={{ background: `${meta.color}1a`, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}
        >
          <Icon size={15} className="text-[var(--c)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: meta.color }}>{meta.label}</span>
            <span className={cn("text-[9px] font-bold tracking-wider", r.text)}>{r.label}</span>
          </div>
          <div className="mt-0.5 truncate text-[12.5px] font-semibold text-[#e1e2eb]">{e.label}</div>
          {e.alias && <div className="mono text-[10px] text-[#5a6573] truncate">{e.alias}</div>}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[#1f2630] px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", r.dot)} />
          <span className="mono text-[10px] text-[#bbcabf]">risk {e.riskScore}</span>
        </div>
        <span className="mono text-[10px] text-[#5a6573]">conf {e.confidence}%</span>
        <span className="mono text-[10px] text-[#5a6573]">·</span>
        <span className="mono text-[10px] text-[#5a6573]">{e.connections}↔</span>
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
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
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
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2630" />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>

      {/* Toolbar */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded border border-[#1f2630] bg-[#161b22]/95 p-1 backdrop-blur">
        <ToolBtn icon={Layers} label="Layout" />
        <ToolBtn icon={Filter} label="Filter" />
        <ToolBtn icon={Maximize2} label="Fit" />
      </div>

      {/* AI status card */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute right-3 top-3 w-[260px] rounded border border-[#1f2630] bg-[#161b22]/95 backdrop-blur"
      >
        <div className="flex items-center gap-2 border-b border-[#1f2630] px-3 py-2">
          <div className="relative flex h-6 w-6 items-center justify-center rounded bg-[#0f2a22]">
            <Sparkles size={12} className="text-[#4edea3]" />
            <span className="absolute inset-0 rounded bg-[#4edea3]/20 animate-ping" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#4edea3]">AI Inference Live</div>
            <div className="mono text-[10px] text-[#5a6573]">model · sentinel-graph-v2.4</div>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="flex items-baseline gap-1.5">
            <span className="mono text-[22px] font-bold text-[#e1e2eb]">14</span>
            <span className="text-[11px] text-[#bbcabf]">new relationships detected</span>
          </div>
          <div className="mt-1 text-[10.5px] text-[#5a6573]">Cluster KZ-FIU-118 · cross-platform correlation +6.2σ</div>
        </div>
      </motion.div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 w-[244px] rounded border border-[#1f2630] bg-[#161b22]/95 backdrop-blur p-2.5">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#bbcabf]">Legend</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {Object.entries(KIND_META).map(([k, m]) => {
            const Icon = m.icon;
            return (
              <div key={k} className="flex items-center gap-1.5 text-[10.5px] text-[#bbcabf]">
                <Icon size={10} className="shrink-0" style={{ color: m.color }} />
                <span>{m.label}</span>
              </div>
            );
          })}
        </div>
        <div className="my-2 h-px bg-[#1f2630]" />
        <div className="flex items-center justify-between gap-1">
          {(["low", "medium", "high", "critical"] as const).map((r) => (
            <div key={r} className="flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", riskMeta[r].dot)} />
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#bbcabf]">{r.slice(0,3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button
      title={label}
      className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[11px] text-[#bbcabf] hover:bg-[#0d1117] hover:text-[#4edea3]"
    >
      <Icon size={12} /> {label}
    </button>
  );
}