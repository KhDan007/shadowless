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
  evidence: { label: "Evidence", icon: FileSearch,  color: "text-foreground/80", bg: "bg-secondary" },
  ai:       { label: "AI",        icon: Brain,       color: "text-primary", bg: "bg-secondary" },
  alert:    { label: "Alert",     icon: Bell,        color: "text-[color:var(--risk-high)]", bg: "bg-[color:var(--risk-high)]/15" },
  ack:      { label: "Ack",       icon: Check,       color: "text-primary", bg: "bg-primary/15" },
  note:     { label: "Note",      icon: StickyNote,  color: "text-[color:var(--risk-medium)]", bg: "bg-primary/20" },
  report:   { label: "Report",    icon: FileText,    color: "text-primary", bg: "bg-primary/15" },
  case:     { label: "Case",      icon: Briefcase,   color: "text-foreground/80", bg: "bg-secondary" },
  action:   { label: "Action",    icon: Zap,         color: "text-destructive", bg: "bg-destructive/15" },
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
              active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground/80",
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
            ? "border-primary/60 bg-primary/15 text-primary"
            : "border-border bg-background text-foreground/80 hover:border-border",
        )}
        title="Show only pinned milestones"
      >
        <Pin size={10} /> pinned {pinnedCount}
      </button>
      <button
        onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
        className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-foreground/80 hover:border-border"
        title="Toggle chronological order"
      >
        <ArrowDownUp size={10} /> {order === "desc" ? "newest" : "oldest"}
      </button>
    </div>
  );

  const body = (
    <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
      {grouped.length === 0 ? (
        <div className="px-3 py-8 text-center text-[12px] text-muted-foreground">No events match this filter.</div>
      ) : (
        <ol className="relative">
          {/* vertical rail */}
          <span className="absolute left-[14px] top-0 bottom-0 w-px bg-muted" aria-hidden />
          {grouped.map(([day, items]) => (
            <li key={day} className="mb-4">
              <div className="mb-2 ml-8 inline-flex items-center gap-2">
                <span className="mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{day}</span>
                <span className="mono text-[10.5px] text-muted-foreground/60">· {items.length} event{items.length === 1 ? "" : "s"}</span>
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-1.5">
          <span className="mono text-[11px] text-muted-foreground">
            {filtered.length} of {TIMELINE_EVENTS.length} events · case KZ-2048
          </span>
          {toolbar}
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-foreground/80">Investigation Timeline</h3>
          <span className="mono text-[11px] text-muted-foreground">case KZ-2048 · {TIMELINE_EVENTS.length} events</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Filter size={11} /> filters below</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-1.5">
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
          "absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border",
          meta.bg,
        )}
        title={meta.label}
      >
        <Icon size={13} className={meta.color} />
      </span>
      <div className="rounded border border-border bg-background px-3 py-2 hover:border-border">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("mono rounded-sm px-1 py-px text-[10px] font-bold uppercase tracking-wider", meta.bg, meta.color)}>
            {meta.label}
          </span>
          <span className="text-[13px] font-semibold text-foreground">{event.title}</span>
          {event.risk && <RiskBadge risk={event.risk as RiskLevel} />}
          {event.pinned && (
            <span className="inline-flex items-center gap-1 rounded-sm border border-primary/40 px-1 py-px text-[10px] font-bold uppercase text-primary">
              <Pin size={9} /> milestone
            </span>
          )}
          <span className="mono ml-auto text-[10.5px] text-muted-foreground">{event.time} · {event.id}</span>
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-foreground/80">{event.detail}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 mono text-[11px] text-muted-foreground">
          <span>{event.actor}</span>
          {entities.length > 0 && <span>·</span>}
          {entities.map((ent) => (
            <button
              key={ent.id}
              onClick={() => jumpToEntity(ent.id, ent.label)}
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-px text-[11px] text-foreground/80 hover:border-primary/50 hover:text-primary"
              title="Focus in graph"
            >
              <ExternalLink size={9} /> {ent.label}
            </button>
          ))}
          {report && (
            <Link
              to="/reports/$id"
              params={{ id: report.id }}
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-px text-[11px] text-primary hover:border-primary/50"
            >
              <FileText size={9} /> {report.id}
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}