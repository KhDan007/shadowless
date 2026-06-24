import { motion, AnimatePresence } from "framer-motion";
import {
  Pin, Clock, FileText, ChevronRight, ShieldAlert, Activity, ArrowRight, X,
} from "lucide-react";
import { useSentinelData } from "./store";
import { MonoKV, Panel, PanelHeader, ProgressBar, RiskBadge, StatusChip, riskMeta } from "./atoms";
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
      <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-[#1f2630] bg-[#0b0e14]">
        <div className="flex items-center gap-2 border-b border-[#1f2630] px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5a6573]">Entity Intelligence</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[#1f2630] text-[#ffc94d]">
            <MousePointerClick size={20} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[#e1e2eb]">No entity selected</div>
            <p className="mt-1 text-[12.5px] leading-snug text-[#8b96a3]">
              Select a node on the graph to inspect its risk profile, identifiers and evidence.
            </p>
          </div>
          <div className="mono mt-1 text-[11px] text-[#5a6573]">
            Tip · highest risk · <span className="text-[#ff5d6c]">Entity Alpha</span>
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
      "flex h-full flex-col bg-[#0b0e14]",
      variant === "rail" ? "w-[320px] shrink-0 border-l border-[#1f2630]" : "w-full",
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
          <div className="border-b border-[#1f2630] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5a6573]">Entity Intelligence</span>
              <RiskBadge risk={entity.risk} className="ml-auto" />
              {onClose && (
                <button onClick={onClose} className="ml-1 text-[#5a6573] hover:text-[#e1e2eb]" aria-label="Close">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-bold leading-tight text-[#e1e2eb]">{entity.label}</h2>
                {entity.alias && <div className="mono text-[12px] text-[#5a6573]">{entity.alias}</div>}
              </div>
              <button
                onClick={() => toast.success("Pinned to case board")}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#b8b8b8] hover:border-[#30363d] hover:text-[#ffc94d]"
                title="Pin entity"
              >
                <Pin size={13} />
              </button>
            </div>
            <button
              onClick={goTimeline}
              className={cn(
                "mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-[#ffb000] text-[13px] font-bold tracking-wide text-[#1a1200] hover:bg-[#ffc94d]",
                "shadow-[0_0_0_1px_rgba(255,201,77,0.45),0_0_18px_rgba(255,176,0,0.3)]",
              )}
            >
              <ShieldAlert size={13} /> INVESTIGATE <ArrowRight size={13} />
            </button>
          </div>

          {/* Score strip: one composite card */}
          <section className="border-b border-[#1f2630] px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b8b8b8]">Risk Score</span>
              <div className="flex items-baseline gap-1">
                <span className={cn("mono text-[26px] font-bold leading-none tabular-nums", r.text)}>{score}</span>
                <span className="text-[11px] text-[#5a6573]">/100</span>
              </div>
            </div>
            <div className="mt-2"><ProgressBar value={score} tone="risk" /></div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              <Metric label="Confidence" value={`${entity.confidence}%`} />
              <Metric label="Connections" value={String(entity.connections)} />
              <Metric label="Reliability" value={entity.reliability} />
            </div>
          </section>

          {/* Tabbed body */}
          <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="h-9 w-full justify-start gap-0 rounded-none border-b border-[#1f2630] bg-[#0b0e14] px-3 p-0">
              {[
                { v: "summary", label: "Summary" },
                { v: "identifiers", label: `Identifiers · ${entity.identifiers.length}` },
                { v: "evidence", label: `Evidence · ${entity.evidence.length}` },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="relative h-9 rounded-none border-0 bg-transparent px-2.5 text-[12.5px] font-semibold text-[#b8b8b8] data-[state=active]:bg-transparent data-[state=active]:text-[#e1e2eb] data-[state=active]:shadow-none"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="summary" className="m-0 flex-1 overflow-y-auto px-4 py-3 data-[state=inactive]:hidden">
              <div className="flex items-center gap-1.5">
                <StatusChip tone="good">LIVE</StatusChip>
                <span className="mono text-[11px] text-[#5a6573]">sentinel-graph-v2.4</span>
              </div>
              <p className="mt-2 min-h-[68px] text-[13px] leading-[1.55] text-[#b8b8b8]">
                {aiText}
                <span className="ml-0.5 inline-block h-3 w-[2px] -mb-0.5 align-middle bg-[#ffc94d] animate-pulse" />
              </p>
              <div className="mt-3 rounded-sm border border-[#1f2630] bg-[#0d1117] p-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                  <div className="text-[#5a6573]">Source</div><div className="truncate text-[#e1e2eb]">{entity.source}</div>
                  <div className="text-[#5a6573]">Reliability</div><div className="text-[#e1e2eb]">{entity.reliability} · vetted</div>
                  <div className="text-[#5a6573]">Last detected</div><div className="mono text-[#e1e2eb]">{entity.lastSeen}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="identifiers" className="m-0 flex-1 overflow-y-auto px-4 py-2 data-[state=inactive]:hidden">
              {entity.identifiers.map((id) => <MonoKV key={id.label} k={id.label} v={id.value} />)}
            </TabsContent>

            <TabsContent value="evidence" className="m-0 flex-1 overflow-y-auto p-0 data-[state=inactive]:hidden">
              <div className="divide-y divide-[#1f2630]">
                {(entity.evidence.length
                  ? entity.evidence
                  : [{ id: "—", title: "No primary evidence linked yet — run a scan to populate.", time: "—" }]
                ).map((ev) => (
                  <button key={ev.id} className="group flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-[#0d1117]">
                    <Activity size={12} className="shrink-0 text-[#ffc94d]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-[#e1e2eb]">{ev.title}</div>
                      <div className="mono text-[11px] text-[#5a6573]">{ev.id} · {ev.time}</div>
                    </div>
                    <ChevronRight size={12} className="text-[#5a6573] group-hover:text-[#ffc94d]" />
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-[#1f2630] p-3">
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
    <div className="rounded-sm border border-[#1f2630] bg-[#0d1117] px-2 py-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#5a6573]">{label}</div>
      <div className="mono text-[13.5px] font-semibold text-[#e1e2eb]">{value}</div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-sm border border-[#1f2630] bg-[#0d1117] text-[12.5px] font-semibold text-[#b8b8b8] hover:border-[#30363d] hover:text-[#e1e2eb]"
    >
      <Icon size={13} /> {label}
    </button>
  );
}