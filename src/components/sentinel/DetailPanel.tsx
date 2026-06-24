import { motion, AnimatePresence } from "framer-motion";
import {
  Pin, Clock, FileText, ChevronRight, ShieldAlert, Activity, ArrowRight, X,
} from "lucide-react";
import { useSentinelData } from "./store";
import { MonoKV, RiskBadge, StatusChip, riskMeta } from "./atoms";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

export function DetailPanel({
  selectedId,
  onClose,
  variant = "rail",
}: {
  selectedId: string | null;
  onClose?: () => void;
  variant?: "rail" | "sheet";
}) {
  // Empty state: only the rail variant shows it (sheet/drawer always open with a selection).
  if (!selectedId && variant === "rail") {
    return (
      <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Entity Intelligence</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border text-primary">
            <MousePointerClick size={20} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-foreground">No entity selected</div>
            <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
              Select a node on the graph to inspect its risk profile, identifiers and evidence.
            </p>
          </div>
          <div className="mono mt-1 text-[11px] text-muted-foreground">
            Tip · highest risk · <span className="text-destructive">Entity Alpha</span>
          </div>
        </div>
      </aside>
    );
  }

  const entities = useSentinelData((s) => s.entities);
  const entity = entities.find((e) => e.id === selectedId) ?? entities[0];
  if (!entity) return null;
  const [score, setScore] = useState(0);
  const [aiText, setAiText] = useState("");
  const navigate = useNavigate();
  const goTimeline = () => navigate({ to: "/timeline" });
  const goEvidence = () => navigate({ to: "/evidence" });

  useEffect(() => {
    setScore(0); setAiText("");
    const s = setInterval(() => setScore((v) => (v >= entity.riskScore ? entity.riskScore : v + 3)), 25);
    let i = 0;
    const t = setInterval(() => {
      if (i >= entity.summary.length) { clearInterval(t); return; }
      i += 2;
      setAiText(entity.summary.slice(0, i));
    }, 14);
    return () => { clearInterval(s); clearInterval(t); };
  }, [entity.id, entity.riskScore, entity.summary]);

  const r = riskMeta[entity.risk];

  return (
    <aside className={cn(
      "flex h-full flex-col bg-card",
      variant === "rail" ? "w-[320px] shrink-0 border-l border-border" : "w-full",
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={entity.id}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 14 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex h-full flex-col"
        >
          {/* Header: identity + ONE primary CTA */}
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Entity Intelligence</span>
              <RiskBadge risk={entity.risk} className="ml-auto" />
              {onClose && (
                <button onClick={onClose} className="ml-1 text-muted-foreground hover:text-foreground" aria-label="Close">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-bold leading-tight text-foreground">{entity.label}</h2>
                {entity.alias && <div className="mono text-[12px] text-muted-foreground">{entity.alias}</div>}
              </div>
              <button
                onClick={() => toast.success("Pinned to case board")}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-border hover:text-primary"
                title="Pin entity"
              >
                <Pin size={13} />
              </button>
            </div>
            <button
              onClick={goTimeline}
              className={cn(
                "mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-primary text-[13px] font-bold tracking-wide text-primary-foreground hover:bg-primary",
                "shadow-[0_0_0_1px_rgba(78,222,163,0.45),0_0_18px_rgba(16,185,129,0.3)]",
              )}
            >
              <ShieldAlert size={13} /> INVESTIGATE <ArrowRight size={13} />
            </button>
          </div>

          {/* Score strip: etched 0–100 ramp + signal-log breakdown */}
          <section className="border-b border-border px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80">Risk Score</span>
              <div className="flex items-baseline gap-1">
                <span className={cn("mono text-[26px] font-bold leading-none tabular-nums", r.text)}>{score}</span>
                <span className="text-[11px] text-muted-foreground">/100</span>
              </div>
            </div>
            {/* Etched ramp */}
            <div className="mt-2 relative">
              <div className="h-1.5 w-full overflow-hidden rounded-none border border-border bg-background">
                <div
                  className={cn(
                    "h-full transition-all duration-700",
                    entity.risk === "critical" && "bg-destructive",
                    entity.risk === "high"     && "bg-[color:var(--risk-high)]",
                    entity.risk === "medium"   && "bg-[color:var(--risk-medium)]",
                    entity.risk === "low"      && "bg-primary",
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>
              {/* Tick marks: 0 / 25 / 50 / 75 / 100 */}
              <div className="relative mt-0.5 h-2">
                {[0, 25, 50, 75, 100].map((t) => (
                  <span
                    key={t}
                    className="absolute top-0 h-1 w-px bg-muted-foreground/50"
                    style={{ left: `${t}%`, transform: t === 100 ? "translateX(-1px)" : undefined }}
                  />
                ))}
              </div>
              <div className="mono mt-0 flex justify-between text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <Metric label="Confidence" value={`${entity.confidence}%`} />
              <Metric label="Connections" value={String(entity.connections)} />
              <Metric label="Reliability" value={entity.reliability} />
            </div>

            {/* Contributing signals — analyst's notebook */}
            {entity.riskFactors && entity.riskFactors.length > 0 && (
              <div className="mt-3 border-t border-border pt-2">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Contributing signals
                  </span>
                  <span className="mono text-[10px] text-muted-foreground">
                    Σ {entity.riskFactors.reduce((a, f) => a + f.delta, 0)}
                  </span>
                </div>
                <ul className="space-y-1">
                  {entity.riskFactors.map((f, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 border-b border-border/50 py-0.5 last:border-0"
                      title={`${f.source} · ${f.time}`}
                    >
                      <span className="mono text-[10.5px] text-primary">+{f.delta.toString().padStart(2, "0")}</span>
                      <span className="truncate text-[11.5px] text-foreground/85">{f.label}</span>
                      <span className="mono text-[10px] text-muted-foreground">{f.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Tabbed body */}
          <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="h-9 w-full justify-start gap-0 rounded-none border-b border-border bg-card px-3 p-0">
              {[
                { v: "summary", label: "Summary" },
                { v: "identifiers", label: `Identifiers · ${entity.identifiers.length}` },
                { v: "evidence", label: `Evidence · ${entity.evidence.length}` },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="relative h-9 rounded-none border-0 bg-transparent px-2.5 text-[12.5px] font-semibold text-foreground/80 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="summary" className="m-0 flex-1 overflow-y-auto px-4 py-3 data-[state=inactive]:hidden">
              <div className="flex items-center gap-1.5">
                <StatusChip tone="good">LIVE</StatusChip>
                <span className="mono text-[11px] text-muted-foreground">sentinel-graph-v2.4</span>
              </div>
              <p className="mt-2 min-h-[68px] text-[13px] leading-[1.55] text-foreground/80">
                {aiText}
                <span className="ml-0.5 inline-block h-3 w-[2px] -mb-0.5 align-middle bg-primary animate-pulse" />
              </p>
              <div className="mt-3 rounded-sm border border-border bg-background p-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                  <div className="text-muted-foreground">Source</div><div className="truncate text-foreground">{entity.source}</div>
                  <div className="text-muted-foreground">Reliability</div><div className="text-foreground">{entity.reliability} · vetted</div>
                  <div className="text-muted-foreground">Last detected</div><div className="mono text-foreground">{entity.lastSeen}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="identifiers" className="m-0 flex-1 overflow-y-auto px-4 py-2 data-[state=inactive]:hidden">
              {entity.identifiers.map((id) => <MonoKV key={id.label} k={id.label} v={id.value} />)}
            </TabsContent>

            <TabsContent value="evidence" className="m-0 flex-1 overflow-y-auto p-0 data-[state=inactive]:hidden">
              <div className="divide-y divide-border">
                {(entity.evidence.length
                  ? entity.evidence
                  : [{ id: "—", title: "No primary evidence linked yet — run a scan to populate.", time: "—" }]
                ).map((ev) => (
                  <button key={ev.id} className="group flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-background">
                    <Activity size={12} className="shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-foreground">{ev.title}</div>
                      <div className="mono text-[11px] text-muted-foreground">{ev.id} · {ev.time}</div>
                    </div>
                    <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-border p-3">
            <ActionBtn icon={Clock} label="Open Timeline" onClick={goTimeline} />
            <ActionBtn icon={FileText} label="Open Evidence" onClick={goEvidence} />
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-background px-2 py-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mono text-[13.5px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-sm border border-border bg-background text-[12.5px] font-semibold text-foreground/80 hover:border-border hover:text-foreground"
    >
      <Icon size={13} /> {label}
    </button>
  );
}