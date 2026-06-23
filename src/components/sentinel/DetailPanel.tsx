import { motion, AnimatePresence } from "framer-motion";
import {
  Pin, Clock, FileText, ChevronRight, ShieldAlert, Activity, Link2,
} from "lucide-react";
import { ENTITIES } from "./data";
import { MonoKV, Panel, PanelHeader, ProgressBar, RiskBadge, StatusChip, riskMeta } from "./atoms";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DetailPanel({ selectedId }: { selectedId: string | null }) {
  const entity = ENTITIES.find((e) => e.id === selectedId) ?? ENTITIES[0];
  const [score, setScore] = useState(0);
  const [conns, setConns] = useState(0);
  const [aiText, setAiText] = useState("");

  useEffect(() => {
    setScore(0); setConns(0); setAiText("");
    const s = setInterval(() => setScore((v) => (v >= entity.riskScore ? entity.riskScore : v + 3)), 25);
    const c = setInterval(() => setConns((v) => (v >= entity.connections ? entity.connections : v + 1)), 60);
    let i = 0;
    const t = setInterval(() => {
      if (i >= entity.summary.length) { clearInterval(t); return; }
      i += 2;
      setAiText(entity.summary.slice(0, i));
    }, 14);
    return () => { clearInterval(s); clearInterval(c); clearInterval(t); };
  }, [entity.id, entity.riskScore, entity.connections, entity.summary]);

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-[#1f2630] bg-[#0b0e14]">
      <AnimatePresence mode="wait">
        <motion.div
          key={entity.id}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 14 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex h-full flex-col"
        >
          {/* Header */}
          <div className="border-b border-[#1f2630] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a6573]">Entity Intelligence</span>
              <RiskBadge risk={entity.risk} className="ml-auto" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h2 className="text-[18px] font-bold leading-tight text-[#e1e2eb] truncate">{entity.label}</h2>
            </div>
            {entity.alias && <div className="mono text-[11px] text-[#5a6573]">{entity.alias}</div>}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Risk score */}
            <section className="px-4 py-3 border-b border-[#1f2630]">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#bbcabf]">Risk Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="mono text-[28px] font-bold leading-none text-[#e1e2eb] tabular-nums">{score}</span>
                  <span className="text-[10px] text-[#5a6573]">/100</span>
                </div>
              </div>
              <div className="mt-2"><ProgressBar value={score} tone="risk" /></div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <Metric label="Confidence" value={`${entity.confidence}%`} />
                <Metric label="Connections" value={String(conns)} />
                <Metric label="Reliability" value={entity.reliability} />
              </div>
            </section>

            {/* AI summary */}
            <Panel className="m-3">
              <PanelHeader title="AI Summary" hint="sentinel-graph-v2.4" right={<StatusChip tone="good">LIVE</StatusChip>} />
              <div className="p-3 text-[12px] leading-[1.55] text-[#bbcabf] min-h-[64px]">
                {aiText}
                <span className="ml-0.5 inline-block h-3 w-[2px] -mb-0.5 align-middle bg-[#4edea3] animate-pulse" />
              </div>
            </Panel>

            {/* Identifiers */}
            <Panel className="mx-3">
              <PanelHeader title="Key Identifiers" hint={`${entity.identifiers.length} fields`} />
              <div className="px-3 py-1.5">
                {entity.identifiers.map((id) => <MonoKV key={id.label} k={id.label} v={id.value} />)}
              </div>
            </Panel>

            {/* Meta */}
            <Panel className="m-3">
              <PanelHeader title="Provenance" />
              <div className="px-3 py-1.5">
                <MonoKV k="Source" v={entity.source} />
                <MonoKV k="Reliability" v={`${entity.reliability} · vetted`} />
                <MonoKV k="Last detected" v={entity.lastSeen} />
              </div>
            </Panel>

            {/* Evidence */}
            <Panel className="mx-3 mb-3">
              <PanelHeader title="Related Evidence" hint={`${entity.evidence.length}`} />
              <div className="divide-y divide-[#1f2630]">
                {(entity.evidence.length ? entity.evidence : [{ id: "ev-—", title: "No primary evidence linked yet", time: "—" }]).map((ev) => (
                  <button key={ev.id} className="group flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#0d1117]">
                    <Activity size={12} className="text-[#4edea3] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] text-[#e1e2eb]">{ev.title}</div>
                      <div className="mono text-[10px] text-[#5a6573]">{ev.id} · {ev.time}</div>
                    </div>
                    <ChevronRight size={12} className="text-[#5a6573] group-hover:text-[#4edea3]" />
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-1.5 border-t border-[#1f2630] p-3">
            <ActionBtn icon={Pin} label="Pin" onClick={() => toast("Entity pinned to case board")} />
            <ActionBtn icon={Clock} label="Timeline" onClick={() => toast("Opening timeline view")} />
            <ActionBtn icon={FileText} label="Report" primary onClick={() => toast.success("Report draft generated")} />
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-[#1f2630] bg-[#0d1117] px-2 py-1.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-[#5a6573]">{label}</div>
      <div className="mono text-[12.5px] font-semibold text-[#e1e2eb]">{value}</div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, primary, onClick }: { icon: any; label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        primary
          ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-sm bg-[#10b981] text-[12px] font-bold text-[#00251a] hover:bg-[#0fcb91] shadow-[0_0_0_1px_rgba(78,222,163,0.5)]"
          : "inline-flex h-9 items-center justify-center gap-1.5 rounded-sm border border-[#1f2630] bg-[#0d1117] text-[12px] font-semibold text-[#bbcabf] hover:border-[#30363d] hover:text-[#e1e2eb]"
      }
    >
      <Icon size={13} /> {label}
    </button>
  );
}