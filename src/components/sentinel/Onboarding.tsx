import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useI18n } from "@/i18n";

interface Step {
  titleKey: string;
  bodyKey: string;
  pos: { top?: string; left?: string; right?: string; bottom?: string; transform?: string };
  arrow?: "left" | "right" | "top" | "bottom";
}

const STEPS: Step[] = [
  {
    titleKey: "ob.step1.title",
    bodyKey: "ob.step1.body",
    pos: { top: "120px", left: "270px" },
    arrow: "left",
  },
  {
    titleKey: "ob.step2.title",
    bodyKey: "ob.step2.body",
    pos: { top: "180px", left: "50%", transform: "translateX(-50%)" },
    arrow: "top",
  },
  {
    titleKey: "ob.step3.title",
    bodyKey: "ob.step3.body",
    pos: { top: "120px", right: "360px" },
    arrow: "right",
  },
];

const KEY = "sentinel.onboarded.v1";

export function Onboarding() {
  const [step, setStep] = useState<number | null>(null);
  const { t } = useI18n();

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
        className="pointer-events-none fixed inset-0 z-[80] bg-background/55 backdrop-blur-[1px]"
      />
      <motion.div
        key={`coach-${step}`}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        style={s.pos}
        className="fixed z-[90] w-[280px] rounded border border-primary/50 bg-secondary p-3 signal-glow"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="mono text-[11px] font-bold tracking-[0.14em] text-primary">
              {t("ob.step")} {step + 1} / {STEPS.length}
            </span>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        </div>
        <div className="mt-1.5 text-[14px] font-semibold text-foreground">{t(s.titleKey)}</div>
        <p className="mt-1 text-[12.5px] leading-snug text-foreground/80">{t(s.bodyKey)}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={dismiss} className="text-[12px] text-muted-foreground hover:text-foreground/80">
            {t("ob.skip")}
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-1 rounded-sm bg-primary px-2.5 py-1 text-[12px] font-bold text-primary-foreground hover:bg-primary"
          >
            {step >= STEPS.length - 1 ? t("ob.done") : t("ob.next")} <ArrowRight size={11} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}