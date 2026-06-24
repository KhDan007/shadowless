import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Radar, ArrowRight, Sparkles } from "lucide-react";
import { useSentinelData } from "./store";
import { cn } from "@/lib/utils";

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

  let key = "idle";
  let icon = <Lightbulb size={12} className="text-[#f5b850]" />;
  let body: React.ReactNode = (
    <>
      <span className="text-[#b8b8b8]">Tip — select a high-risk node to begin investigation.</span>
      <span className="mono ml-1 text-[11px] text-[#8a8a8a]">3 critical nodes</span>
    </>
  );
  let cta: React.ReactNode = null;

  if (scanning) {
    key = "scan";
    icon = <Radar size={12} className="text-[#ffc94d] animate-spin" />;
    body = (
      <>
        <span className="text-[#b8b8b8]">Scanning sources…</span>
        <span className="mono ml-1 text-[11px] text-[#8a8a8a]">{scanStep || "warming up"}</span>
      </>
    );
  } else if (entity) {
    key = `sel-${entity.id}`;
    icon = <Sparkles size={12} className="text-[#ffc94d]" />;
    body = (
      <>
        <span className="text-[#b8b8b8]">Reviewing</span>{" "}
        <span className="font-semibold text-[#e8e8e8]">{entity.label}</span>
        <span className="mono ml-1 text-[11px] text-[#8a8a8a]">risk {entity.riskScore} · conf {entity.confidence}%</span>
      </>
    );
    cta = (
      <button
        onClick={onInvestigate}
        className="ml-auto inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[12px] font-bold text-[#ffc94d] hover:bg-[#2a1f00]"
      >
        Investigate <ArrowRight size={11} />
      </button>
    );
  }

  return (
    <div className={cn("relative flex h-8 items-center gap-2 overflow-hidden border-b border-[#2a2a2a] bg-[#080808] px-3")}>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="flex w-full items-center gap-2 text-[12.5px]"
        >
          <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
          <div className="min-w-0 truncate">{body}</div>
          {cta}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}