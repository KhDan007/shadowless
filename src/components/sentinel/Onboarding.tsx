import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

interface Step {
  title: string;
  body: string;
  pos: { top?: string; left?: string; right?: string; bottom?: string; transform?: string };
  arrow?: "left" | "right" | "top" | "bottom";
}

const STEPS: Step[] = [
  {
    title: "Workspace navigation",
    body: "Switch between Overview, Graph, Evidence and AI Analysis. Active cases live below.",
    pos: { top: "120px", left: "270px" },
    arrow: "left",
  },
  {
    title: "Investigation canvas",
    body: "Tap any node to inspect it. Emerald edges are AI-detected high-confidence links.",
    pos: { top: "180px", left: "50%", transform: "translateX(-50%)" },
    arrow: "top",
  },
  {
    title: "Entity intelligence",
    body: "Review the summary, identifiers and evidence. Use Investigate to open the full timeline.",
    pos: { top: "120px", right: "360px" },
    arrow: "right",
  },
];

const KEY = "sentinel.onboarded.v1";

export function Onboarding() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) !== "1") setStep(0);
    } catch {}
  }, []);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft" && step > 0) setStep(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function dismiss() {
    setStep(null);
    try { window.localStorage.setItem(KEY, "1"); } catch {}
  }
  function next() {
    if (step === null) return;
    if (step >= STEPS.length - 1) dismiss();
    else setStep(step + 1);
  }

  if (step === null) return null;
  const s = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-[80] bg-[#05070b]/55 backdrop-blur-[1px]"
      />
      <motion.div
        key={`coach-${step}`}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        style={s.pos}
        className="fixed z-[90] w-[280px] rounded border border-[#ffb000]/50 bg-[#161b22] p-3 shadow-[0_0_0_1px_rgba(255,201,77,0.25),0_8px_32px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="mono text-[11px] font-bold tracking-[0.14em] text-[#ffc94d]">
              STEP {step + 1} / {STEPS.length}
            </span>
          </div>
          <button onClick={dismiss} className="text-[#5a6573] hover:text-[#e1e2eb]">
            <X size={13} />
          </button>
        </div>
        <div className="mt-1.5 text-[14px] font-semibold text-[#e1e2eb]">{s.title}</div>
        <p className="mt-1 text-[12.5px] leading-snug text-[#b8b8b8]">{s.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={dismiss} className="text-[12px] text-[#5a6573] hover:text-[#b8b8b8]">
            Skip tour
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-1 rounded-sm bg-[#ffb000] px-2.5 py-1 text-[12px] font-bold text-[#1a1200] hover:bg-[#ffc94d]"
          >
            {step >= STEPS.length - 1 ? "Done" : "Next"} <ArrowRight size={11} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}