import { useMemo, useState } from "react";
import {
  TIMELINE_EVENTS, ENTITIES, REPORTS, type TimelineEvent, type TimelineKind, type RiskLevel,
} from "./data";
import { RiskBadge } from "./atoms";
import { cn } from "@/lib/utils";
import {
  FileSearch, Brain, Bell, Check, StickyNote, FileText, Briefcase, Zap,
  Pin, ExternalLink, Filter, ArrowDownUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

const KIND_META: Record<TimelineKind, { label: string; icon: any; color: string; bg: string }> = {
  evidence: { label: "Evidence", icon: FileSearch,  color: "text-[#b8b8b8]", bg: "bg-[#161b22]" },
  ai:       { label: "AI",        icon: Brain,       color: "text-[#9b8cff]", bg: "bg-[#1c1830]" },
  alert:    { label: "Alert",     icon: Bell,        color: "text-[#ff8a4c]", bg: "bg-[#2d1c12]" },
  ack:      { label: "Ack",       icon: Check,       color: "text-[#ffc94d]", bg: "bg-[#2a1f00]" },
  note:     { label: "Note",      icon: StickyNote,  color: "text-[#f5b850]", bg: "bg-[#2a2113]" },
  report:   { label: "Report",    icon: FileText,    color: "text-[#ffc94d]", bg: "bg-[#2a1f00]" },
  case:     { label: "Case",      icon: Briefcase,   color: "text-[#b8b8b8]", bg: "bg-[#161b22]" },
  action:   { label: "Action",    icon: Zap,         color: "text-[#ff5d6c]", bg: "bg-[#2d1217]" },
};

const KIND_FILTERS: { key: "all" | TimelineKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "evidence", label: "Evidence" },
  { key: "ai", label: "AI" },
  { key: "alert", label: "Alerts" },
  { key: "note", label: "Notes" },
  { key: "report", label: "Reports" },
  { key: "action", label: "Actions" },
];

function groupByDay(events: TimelineEvent[]) {
  const map = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return Array.from(map.entries());
}

function jumpToEntity(id: string, label: string) {
  window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: id }));
  toast(`Focusing ${label}`);
}

export function Timeline({ bare = false }: { bare?: boolean } = {}) {
  const [kind, setKind] = useState<"all" | TimelineKind>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    let list = TIMELINE_EVENTS.slice();
    if (kind !== "all") list = list.filter((e) => e.kind === kind);
    if (pinnedOnly) list = list.filter((e) => e.pinned);
    list.sort((a, b) => (a.ts < b.ts ? 1 : -1) * (order === "desc" ? 1 : -1));
    return list;
  }, [kind, pinnedOnly, order]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);
  const pinnedCount = TIMELINE_EVENTS.filter((e) => e.pinned).length;

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1">
      {KIND_FILTERS.map((f) => {
        const active = kind === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setKind(f.key)}
            className={cn(
              "rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
              active ? "bg-[#2a1f00] text-[#ffc94d]" : "text-[#5a6573] hover:text-[#b8b8b8]",
            )}
          >
            {f.label}
          </button>
        );
      })}
      <button
        onClick={() => setPinnedOnly((v) => !v)}
        className={cn(
          "ml-1 inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
          pinnedOnly
            ? "border-[#ffb000]/60 bg-[#2a1f00] text-[#ffc94d]"
            : "border-[#1f2630] bg-[#0d1117] text-[#b8b8b8] hover:border-[#30363d]",
        )}
        title="Show only pinned milestones"
      >
        <Pin size={10} /> pinned {pinnedCount}
      </button>
      <button
        onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
        className="inline-flex items-center gap-1 rounded-sm border border-[#1f2630] bg-[#0d1117] px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#b8b8b8] hover:border-[#30363d]"
        title="Toggle chronological order"
      >
        <ArrowDownUp size={10} /> {order === "desc" ? "newest" : "oldest"}
      </button>
    </div>
  );

  const body = (
    <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
      {grouped.length === 0 ? (
        <div className="px-3 py-8 text-center text-[12px] text-[#5a6573]">No events match this filter.</div>
      ) : (
        <ol className="relative">
          {/* vertical rail */}
          <span className="absolute left-[14px] top-0 bottom-0 w-px bg-[#1f2630]" aria-hidden />
          {grouped.map(([day, items]) => (
            <li key={day} className="mb-4">
              <div className="mb-2 ml-8 inline-flex items-center gap-2">
                <span className="mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#5a6573]">{day}</span>
                <span className="mono text-[10.5px] text-[#3a3a3a]">· {items.length} event{items.length === 1 ? "" : "s"}</span>
              </div>
              <ul className="space-y-2">
                {items.map((e) => <TimelineRow key={e.id} event={e} />)}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  if (bare) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2630] bg-[#0d1117] px-3 py-1.5">
          <span className="mono text-[11px] text-[#5a6573]">
            {filtered.length} of {TIMELINE_EVENTS.length} events · case KZ-2048
          </span>
          {toolbar}
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-[#1f2630] bg-[#0b0e14]">
      <div className="flex items-center justify-between border-b border-[#1f2630] px-3 py-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#b8b8b8]">Investigation Timeline</h3>
          <span className="mono text-[11px] text-[#5a6573]">case KZ-2048 · {TIMELINE_EVENTS.length} events</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#5a6573]"><Filter size={11} /> filters below</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1f2630] bg-[#0d1117] px-3 py-1.5">
        {toolbar}
      </div>
      {body}
    </div>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const meta = KIND_META[event.kind];
  const Icon = meta.icon;
  const entities = (event.entityIds ?? [])
    .map((id) => ENTITIES.find((e) => e.id === id))
    .filter(Boolean) as (typeof ENTITIES)[number][];
  const report = event.reportId ? REPORTS.find((r) => r.id === event.reportId) : undefined;

  return (
    <li className="relative pl-8">
      <span
        className={cn(
          "absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#1f2630]",
          meta.bg,
        )}
        title={meta.label}
      >
        <Icon size={13} className={meta.color} />
      </span>
      <div className="rounded border border-[#1f2630] bg-[#0d1117] px-3 py-2 hover:border-[#30363d]">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("mono rounded-sm px-1 py-px text-[10px] font-bold uppercase tracking-wider", meta.bg, meta.color)}>
            {meta.label}
          </span>
          <span className="text-[13px] font-semibold text-[#e1e2eb]">{event.title}</span>
          {event.risk && <RiskBadge risk={event.risk as RiskLevel} />}
          {event.pinned && (
            <span className="inline-flex items-center gap-1 rounded-sm border border-[#ffb000]/40 px-1 py-px text-[10px] font-bold uppercase text-[#ffc94d]">
              <Pin size={9} /> milestone
            </span>
          )}
          <span className="mono ml-auto text-[10.5px] text-[#5a6573]">{event.time} · {event.id}</span>
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-[#b8b8b8]">{event.detail}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 mono text-[11px] text-[#5a6573]">
          <span>{event.actor}</span>
          {entities.length > 0 && <span>·</span>}
          {entities.map((ent) => (
            <button
              key={ent.id}
              onClick={() => jumpToEntity(ent.id, ent.label)}
              className="inline-flex items-center gap-1 rounded-sm border border-[#1f2630] bg-[#0b0e14] px-1.5 py-px text-[11px] text-[#b8b8b8] hover:border-[#ffb000]/50 hover:text-[#ffc94d]"
              title="Focus in graph"
            >
              <ExternalLink size={9} /> {ent.label}
            </button>
          ))}
          {report && (
            <Link
              to="/reports/$id"
              params={{ id: report.id }}
              className="inline-flex items-center gap-1 rounded-sm border border-[#1f2630] bg-[#0b0e14] px-1.5 py-px text-[11px] text-[#ffc94d] hover:border-[#ffb000]/50"
            >
              <FileText size={9} /> {report.id}
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}