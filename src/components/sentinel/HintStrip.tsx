import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Radar, ArrowRight, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSentinelData } from "./store";
import { cn } from "@/lib/utils";

const ROTATING_TIPS: { icon: "tip" | "kbd" | "intel"; text: React.ReactNode; meta?: string }[] = [
  { icon: "kbd", text: <>Press <span className="mono rounded-sm border border-border bg-background px-1 py-px text-[10.5px]">⌘K</span> to open the command palette.</>, meta: "shortcut" },
  { icon: "tip", text: <>Select a high-risk node to begin investigation.</>, meta: "3 critical nodes" },
  { icon: "intel", text: <>Edges labeled <span className="mono text-primary">vetted</span> have ≥ 90% confidence.</>, meta: "graph legend" },
  { icon: "kbd", text: <>Use <span className="mono rounded-sm border border-border bg-background px-1 py-px text-[10.5px]">G</span> to refocus the graph, <span className="mono rounded-sm border border-border bg-background px-1 py-px text-[10.5px]">T</span> for timeline.</>, meta: "navigation" },
  { icon: "tip", text: <>Right-click any entity to pin, redact, or export to dossier.</>, meta: "context menu" },
  { icon: "intel", text: <>Live ticker updates every 3.2s from active crawlers.</>, meta: "TG-CRAWL-04" },
  { icon: "tip", text: <>Hold <span className="mono rounded-sm border border-border bg-background px-1 py-px text-[10.5px]">⇧</span> to multi-select nodes for bulk dossier export.</>, meta: "selection" },
  { icon: "intel", text: <>Risk scores recompute when new signals arrive — check the contribution log.</>, meta: "detail panel" },
];

export function HintStrip({
  selectedId,
  scanning: scanningProp,
  onInvestigate,
}: {
  selectedId: string | null;
  scanning?: boolean;
  onInvestigate?: () => void;
}) {
  const entities = useSentinelData((s) => s.entities);
  const scanStep = useSentinelData((s) => s.scan.step);
  const scanActive = useSentinelData((s) => s.scan.active);
  const scanning = scanningProp || scanActive;
  const entity = selectedId ? entities.find((e) => e.id === selectedId) : null;
  const [dismissed, setDismissed] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (scanning || entity || dismissed) return;
    const id = window.setInterval(() => {
      setTipIdx((i) => (i + 1) % ROTATING_TIPS.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [scanning, entity, dismissed]);

  if (dismissed) return null;

  let key = "idle";
  const current = ROTATING_TIPS[tipIdx];
  const iconFor = (k: string) =>
    k === "kbd" ? <Sparkles size={12} className="text-primary" />
    : k === "intel" ? <Radar size={12} className="text-primary" />
    : <Lightbulb size={12} className="text-[color:var(--risk-medium)]" />;
  let icon = iconFor(current.icon);
  let body: React.ReactNode = (
    <>
      <span className="dossier-label mr-1 text-muted-foreground">tip</span>
      <span className="text-foreground/80">{current.text}</span>
      {current.meta && <span className="mono ml-1 text-[11px] text-muted-foreground">· {current.meta}</span>}
    </>
  );
  key = `tip-${tipIdx}`;
  let cta: React.ReactNode = null;

  if (scanning) {
    key = "scan";
    icon = <Radar size={12} className="text-primary animate-spin" />;
    body = (
      <>
        <span className="text-foreground/80">Scanning sources…</span>
        <span className="mono ml-1 text-[11px] text-muted-foreground">{scanStep || "warming up"}</span>
      </>
    );
  } else if (entity) {
    key = `sel-${entity.id}`;
    icon = <Sparkles size={12} className="text-primary" />;
    body = (
      <>
        <span className="text-foreground/80">Reviewing</span>{" "}
        <span className="font-semibold text-foreground">{entity.label}</span>
        <span className="mono ml-1 text-[11px] text-muted-foreground">risk {entity.riskScore} · conf {entity.confidence}%</span>
      </>
    );
    cta = (
      <button
        onClick={onInvestigate}
        className="ml-auto inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[12px] font-bold text-primary hover:bg-primary/15"
      >
        Investigate <ArrowRight size={11} />
      </button>
    );
  }

  return (
    <div className={cn("relative flex h-8 items-center gap-2 overflow-hidden border-b border-border bg-card px-3")}>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="flex w-full items-center gap-2 text-[12.5px]"
        >
          <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
          <div className="min-w-0 truncate">{body}</div>
          {cta}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss tip"
            className={cn(
              "ml-2 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground",
              cta ? "" : "ml-auto"
            )}
          >
            <X size={12} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}