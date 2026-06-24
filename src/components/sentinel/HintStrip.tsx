import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Radar, ArrowRight, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSentinelData } from "./store";
import { cn } from "@/lib/utils";
import { usePersistentBool } from "./useLayout";
import { useI18n } from "@/i18n";

const ROTATING_TIPS: { icon: "tip" | "kbd" | "intel"; textKey: string; metaKey?: string }[] = [
  { icon: "kbd",   textKey: "hint.tip.cmdk",         metaKey: "hint.meta.shortcut" },
  { icon: "tip",   textKey: "hint.tip.select_high",  metaKey: "hint.meta.critical_nodes" },
  { icon: "intel", textKey: "hint.tip.vetted",       metaKey: "hint.meta.legend" },
  { icon: "kbd",   textKey: "hint.tip.gt_nav",       metaKey: "hint.meta.nav" },
  { icon: "tip",   textKey: "hint.tip.right_click",  metaKey: "hint.meta.menu" },
  { icon: "intel", textKey: "hint.tip.live_ticker",  metaKey: "hint.meta.detail" },
  { icon: "tip",   textKey: "hint.tip.shift_multi",  metaKey: "hint.meta.selection" },
  { icon: "intel", textKey: "hint.tip.recompute",    metaKey: "hint.meta.detail" },
  { icon: "kbd",   textKey: "hint.tip.help_key",     metaKey: "hint.meta.help" },
  { icon: "kbd",   textKey: "hint.tip.r_key",        metaKey: "hint.meta.shortcut" },
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
  const { t } = useI18n();
  const entities = useSentinelData((s) => s.entities);
  const scanStep = useSentinelData((s) => s.scan.step);
  const scanActive = useSentinelData((s) => s.scan.active);
  const scanning = scanningProp || scanActive;
  const entity = selectedId ? entities.find((e) => e.id === selectedId) : null;
  const [dismissed, setDismissed] = usePersistentBool("sentinel.hintstrip.dismissed", false);
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
      <span className="dossier-label mr-1 text-muted-foreground">{t("hint.tip")}</span>
      <span className="text-foreground/80">{t(current.textKey)}</span>
      {current.metaKey && <span className="mono ml-1 text-[11px] text-muted-foreground">· {t(current.metaKey)}</span>}
    </>
  );
  key = `tip-${tipIdx}`;
  let cta: React.ReactNode = null;

  if (scanning) {
    key = "scan";
    icon = <Radar size={12} className="text-primary animate-spin" />;
    body = (
      <>
        <span className="text-foreground/80">{t("hint.scanning")}</span>
        <span className="mono ml-1 text-[11px] text-muted-foreground">{scanStep || t("hint.warming_up")}</span>
      </>
    );
  } else if (entity) {
    key = `sel-${entity.id}`;
    icon = <Sparkles size={12} className="text-primary" />;
    body = (
      <>
        <span className="text-foreground/80">{t("hint.reviewing")}</span>{" "}
        <span className="font-semibold text-foreground">{entity.label}</span>
        <span className="mono ml-1 text-[11px] text-muted-foreground">{t("hint.risk")} {entity.riskScore} · {t("hint.conf")} {entity.confidence}%</span>
      </>
    );
    cta = (
      <button
        onClick={onInvestigate}
        className="ml-auto inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[12px] font-bold text-primary hover:bg-primary/15"
      >
        {t("hint.investigate")} <ArrowRight size={11} />
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
            aria-label={t("hint.dismiss")}
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