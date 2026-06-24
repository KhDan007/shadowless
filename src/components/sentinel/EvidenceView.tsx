import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LOG_ROWS, ENTITIES, EVIDENCE_DETAILS, getEvidenceDetail,
  type LogRow, type RiskLevel, type EvidenceArtifact,
} from "./data";
import { RiskBadge, StatusChip } from "./atoms";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Search, Download, Hash, Image as ImageIcon, FileText, MapPin, Database,
  Receipt, Copy, ExternalLink, X, ShieldCheck, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ARTIFACT_ICON: Record<EvidenceArtifact["kind"], any> = {
  screenshot: ImageIcon,
  transcript: FileText,
  transaction: Receipt,
  geo: MapPin,
  metadata: Database,
  document: FileText,
};

type RiskFilter = "all" | RiskLevel;
type StatusFilter = "all" | LogRow["status"];

export function EvidenceView() {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [source, setSource] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const sources = useMemo(() => {
    const s = new Set<string>();
    LOG_ROWS.forEach((r) => s.add(r.source));
    return ["all", ...Array.from(s).sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOG_ROWS.filter((r) => {
      if (risk !== "all" && r.risk !== risk) return false;
      if (status !== "all" && r.status !== status) return false;
      if (source !== "all" && r.source !== source) return false;
      if (q) {
        const hay = `${r.id} ${r.entity} ${r.finding} ${r.source}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, risk, status, source]);

  const stats = useMemo(() => {
    const by = (k: keyof LogRow, v: string) => LOG_ROWS.filter((r) => r[k] === v).length;
    const avgConf = Math.round(
      LOG_ROWS.reduce((s, r) => s + r.confidence, 0) / Math.max(1, LOG_ROWS.length),
    );
    return {
      total: LOG_ROWS.length,
      open: by("status", "open"),
      review: by("status", "review"),
      validated: by("status", "validated"),
      critical: LOG_ROWS.filter((r) => r.risk === "critical").length,
      high: LOG_ROWS.filter((r) => r.risk === "high").length,
      avgConf,
      sourceCount: new Set(LOG_ROWS.map((r) => r.source)).size,
      withArtifacts: LOG_ROWS.filter((r) => EVIDENCE_DETAILS[r.id]).length,
    };
  }, []);

  const reset = () => { setQuery(""); setRisk("all"); setStatus("all"); setSource("all"); };
  const active = query || risk !== "all" || status !== "all" || source !== "all";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="Total evidence"     value={String(stats.total)} hint={`${stats.withArtifacts} with artifacts`} />
        <Stat label="Open"               value={String(stats.open)}     tone="bad" />
        <Stat label="In review"          value={String(stats.review)}   tone="warn" />
        <Stat label="Validated"          value={String(stats.validated)} tone="good" />
        <Stat label="Critical / High"    value={`${stats.critical} / ${stats.high}`} tone="bad" />
        <Stat label="Avg. confidence"    value={`${stats.avgConf}%`}     tone="good" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-card px-3 py-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search id, entity, finding, source…"
            className="h-8 w-full rounded-sm border border-border bg-background pl-7 pr-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
          />
        </div>
        <Segmented<RiskFilter>
          options={[
            { key: "all", label: "All risk" },
            { key: "critical", label: "Critical" },
            { key: "high", label: "High" },
            { key: "medium", label: "Medium" },
            { key: "low", label: "Low" },
          ]}
          value={risk} onChange={setRisk}
        />
        <Segmented<StatusFilter>
          options={[
            { key: "all", label: "Any status" },
            { key: "open", label: "Open" },
            { key: "review", label: "Review" },
            { key: "validated", label: "Validated" },
            { key: "archived", label: "Archived" },
          ]}
          value={status} onChange={setStatus}
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground/80"
        >
          {sources.map((s) => (
            <option key={s} value={s}>{s === "all" ? `All sources (${stats.sourceCount})` : s}</option>
          ))}
        </select>
        {active && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[11px] uppercase tracking-wider text-foreground/80 hover:border-border"
          >
            <X size={11} /> reset
          </button>
        )}
        <span className="ml-auto mono text-[11px] text-muted-foreground">
          {filtered.length} of {LOG_ROWS.length}
        </span>
      </div>

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-border bg-card">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-10 bg-background">
              <tr>
                {["Time", "ID", "Source", "Entity", "Finding", "Confidence", "Risk", "Status", ""].map((h) => (
                  <th key={h} className="border-b border-border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-[12.5px] text-muted-foreground">
                  No evidence matches the current filters.
                </td></tr>
              )}
              {filtered.map((r) => {
                const hasDetail = !!EVIDENCE_DETAILS[r.id];
                const isSel = selected === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className={cn(
                      "group cursor-pointer transition-colors hover:bg-secondary",
                      isSel && "bg-primary/15",
                    )}
                  >
                    <td className="border-b border-border px-3 py-1.5"><span className="mono text-[12px] text-foreground/80">{r.time}</span></td>
                    <td className="border-b border-border px-3 py-1.5"><span className="mono text-[12px] text-muted-foreground">{r.id}</span></td>
                    <td className="border-b border-border px-3 py-1.5"><span className="mono text-[12px] text-foreground">{r.source}</span></td>
                    <td className="border-b border-border px-3 py-1.5"><span className="text-[13px] text-foreground">{r.entity}</span></td>
                    <td className="border-b border-border px-3 py-1.5"><span className="text-[13px] text-foreground/80">{r.finding}</span></td>
                    <td className="border-b border-border px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-14 overflow-hidden rounded bg-background">
                          <div className="h-full" style={{ width: `${r.confidence}%`, background: r.confidence > 85 ? "#4ade80" : r.confidence > 65 ? "#eab308" : "#8a8170" }} />
                        </div>
                        <span className="mono text-[12px] tabular-nums text-foreground">{r.confidence}%</span>
                      </div>
                    </td>
                    <td className="border-b border-border px-3 py-1.5"><RiskBadge risk={r.risk} /></td>
                    <td className="border-b border-border px-3 py-1.5">
                      <StatusChip tone={r.status === "validated" ? "good" : r.status === "review" ? "warn" : r.status === "open" ? "bad" : "neutral"}>
                        {r.status}
                      </StatusChip>
                    </td>
                    <td className="border-b border-border px-3 py-1.5 text-right">
                      <span className={cn("mono text-[10.5px]", hasDetail ? "text-primary" : "text-muted-foreground")}>
                        {hasDetail ? "open →" : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EvidenceDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" }) {
  const toneClass =
    tone === "good" ? "text-primary" :
    tone === "warn" ? "text-[color:var(--risk-medium)]" :
    tone === "bad"  ? "text-[color:var(--risk-high)]" : "text-foreground";
  return (
    <div className="rounded border border-border bg-card px-3 py-2">
      <div className={cn("mono text-[18px] font-semibold tabular-nums", toneClass)}>{value}</div>
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Segmented<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-sm border border-border bg-background">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "px-2 py-1 text-[11px] font-bold uppercase tracking-wider",
              active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground/80",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function EvidenceDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const open = !!id;
  const row = id ? LOG_ROWS.find((r) => r.id === id) : undefined;
  const detail = id ? getEvidenceDetail(id) : undefined;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-[560px] overflow-y-auto border-l border-border bg-card p-0 text-foreground sm:max-w-[600px]">
        <SheetHeader className="sr-only">
          <SheetTitle>{row?.id ?? "Evidence"}</SheetTitle>
          <SheetDescription>{row?.finding}</SheetDescription>
        </SheetHeader>

        {!row ? (
          <div className="p-6 text-[13px] text-muted-foreground">No evidence selected.</div>
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <div className="border-b border-border bg-background px-5 py-4">
              <div className="flex items-center gap-2">
                <RiskBadge risk={row.risk} />
                <StatusChip tone={row.status === "validated" ? "good" : row.status === "review" ? "warn" : row.status === "open" ? "bad" : "neutral"}>
                  {row.status}
                </StatusChip>
                <span className="mono ml-auto text-[11px] text-muted-foreground">{row.id}</span>
              </div>
              <h2 className="mt-2 text-[15px] font-semibold leading-snug text-foreground">{row.finding}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 mono text-[11.5px] text-muted-foreground">
                <span>{row.time}</span>
                <span>· {row.source}</span>
                {detail && <span>· reliability {detail.reliability}</span>}
                {detail && <span>· {detail.classification}</span>}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded bg-card">
                  <div className="h-full" style={{ width: `${row.confidence}%`, background: row.confidence > 85 ? "#4ade80" : row.confidence > 65 ? "#eab308" : "#8a8170" }} />
                </div>
                <span className="mono text-[12px] tabular-nums text-foreground">{row.confidence}% conf</span>
              </div>
            </div>

            {!detail ? (
              <div className="px-5 py-6 text-[13px] text-foreground/80">
                <p>{row.finding}</p>
                <p className="mt-2 text-[12px] text-muted-foreground">Extended chain-of-custody and artifacts are not available for this entry.</p>
              </div>
            ) : (
              <div className="space-y-5 px-5 py-5">
                {/* Narrative */}
                <Section title="Narrative">
                  <p className="text-[13px] leading-relaxed text-foreground/80">{detail.narrative}</p>
                </Section>

                {/* Collector */}
                <Section title="Collection">
                  <KV k="Collector"      v={detail.collector} />
                  <KV k="Collected at"   v={detail.collectedAt} mono />
                  <KV k="Case"           v={detail.caseId} mono />
                  <KV k="Classification" v={detail.classification} mono />
                </Section>

                {/* Linked entities */}
                {detail.entityIds.length > 0 && (
                  <Section title="Linked entities">
                    <div className="flex flex-wrap gap-1.5">
                      {detail.entityIds.map((eid) => {
                        const ent = ENTITIES.find((e) => e.id === eid);
                        if (!ent) return null;
                        return (
                          <button
                            key={eid}
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: eid }));
                              toast(`Focusing ${ent.label}`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-1 text-[12px] text-foreground/80 hover:border-primary/60 hover:text-primary"
                          >
                            <ExternalLink size={11} />
                            <span>{ent.label}</span>
                            <RiskBadge risk={ent.risk} className="ml-1" />
                          </button>
                        );
                      })}
                      <Link
                        to="/"
                        className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[11px] uppercase tracking-wider text-primary hover:border-primary/60"
                      >
                        view in graph
                      </Link>
                    </div>
                  </Section>
                )}

                {/* Artifacts */}
                <Section title={`Artifacts · ${detail.artifacts.length}`}>
                  <ul className="space-y-1.5">
                    {detail.artifacts.map((a) => {
                      const Icon = ARTIFACT_ICON[a.kind];
                      return (
                        <li key={a.filename} className="flex items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-1.5">
                          <Icon size={14} className="text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="mono truncate text-[12.5px] text-foreground">{a.filename}</div>
                            <div className="mono flex items-center gap-2 text-[10.5px] text-muted-foreground">
                              <span>{a.mime}</span>
                              <span>· {a.sizeKb} KB</span>
                              <span className="inline-flex items-center gap-0.5"><Hash size={9} /> {a.sha256}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { navigator.clipboard?.writeText(a.sha256); toast.success("SHA-256 copied"); }}
                            className="inline-flex h-6 items-center justify-center rounded-sm border border-border px-1.5 text-foreground/80 hover:border-border hover:text-foreground"
                            title="Copy hash"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            onClick={() => toast.success(`Downloading ${a.filename}`)}
                            className="inline-flex h-6 items-center justify-center rounded-sm border border-border px-1.5 text-foreground/80 hover:border-border hover:text-foreground"
                            title="Download"
                          >
                            <Download size={11} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Section>

                {/* Custody */}
                <Section title="Chain of custody">
                  <ol className="relative ml-2 space-y-2 border-l border-border pl-4">
                    {detail.custody.map((c, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[18px] top-1 flex h-3 w-3 items-center justify-center rounded-full border border-primary/50 bg-background">
                          <ShieldCheck size={8} className="text-primary" />
                        </span>
                        <div className="text-[12.5px] text-foreground">
                          <span className="font-semibold">{c.action}</span>
                          <span className="text-muted-foreground"> · {c.actor}</span>
                        </div>
                        <div className="mono text-[10.5px] text-muted-foreground">{c.ts}</div>
                        {c.note && <div className="mt-0.5 text-[11.5px] text-foreground/80">{c.note}</div>}
                      </li>
                    ))}
                  </ol>
                </Section>

                {/* Tags */}
                {detail.tags.length > 0 && (
                  <Section title="Tags">
                    <div className="flex flex-wrap gap-1">
                      {detail.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground/80">
                          <Tag size={9} /> {t}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => toast.success(`Validated ${row.id}`)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/15 px-2.5 text-[12.5px] font-semibold text-primary hover:border-primary/80"
                  >
                    <ShieldCheck size={13} /> Validate
                  </button>
                  <button
                    onClick={() => toast.success(`Bundle queued for ${row.id}`)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12.5px] font-semibold text-foreground/80 hover:border-border hover:text-foreground"
                  >
                    <Download size={13} /> Export bundle
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border py-1 last:border-b-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className={cn("text-right text-[12.5px] text-foreground", mono && "mono text-[12px]")}>{v}</span>
    </div>
  );
}