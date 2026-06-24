import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileSearch, Brain, Activity, Bell, History } from "lucide-react";
import { EvidenceTable, AIFindings, ConfidenceChart, RecentAlerts } from "./BottomPanels";
import { Timeline } from "./Timeline";
import { cn } from "@/lib/utils";
import { usePersistentBool } from "./useLayout";

type TabKey = "evidence" | "ai" | "trends" | "alerts" | "timeline";

const TABS: { key: TabKey; label: string; icon: any; count?: string; tone?: "good" | "warn" | "bad" }[] = [
  { key: "evidence", label: "Evidence",   icon: FileSearch, count: "10" },
  { key: "ai",       label: "AI Findings", icon: Brain,     count: "14 new", tone: "good" },
  { key: "timeline", label: "Timeline",    icon: History,   count: "16" },
  { key: "trends",   label: "Trends",      icon: Activity },
  { key: "alerts",   label: "Alerts",      icon: Bell,      count: "3", tone: "bad" },
];

export function BottomDock({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<TabKey>("evidence");
  const [open, setOpen] = usePersistentBool("sentinel.dock.open", true);

  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent<TabKey>).detail;
      if (key && TABS.some((t) => t.key === key)) {
        setTab(key);
        setOpen(true);
      }
    };
    window.addEventListener("sentinel:open-dock-tab", handler as EventListener);
    return () => window.removeEventListener("sentinel:open-dock-tab", handler as EventListener);
  }, [setOpen]);

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded border border-[#1f2630] bg-[#0b0e14]",
        embedded ? "flex-1 min-h-0" : open ? "h-[300px] shrink-0" : "h-9 shrink-0",
      )}
    >
      <header className="flex h-9 shrink-0 items-center gap-1 border-b border-[#1f2630] bg-[#0d1117] px-1.5">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); if (!open) setOpen(true); }}
                className={cn(
                  "relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-[12.5px] font-semibold transition-colors",
                  active ? "bg-[#161b22] text-[#e1e2eb]" : "text-[#b8b8b8] hover:bg-[#161b22]/60 hover:text-[#e1e2eb]",
                )}
              >
                {active && <span className="absolute inset-x-2 -bottom-px h-[1.5px] rounded-full bg-[#ffb000] shadow-[0_0_6px_#ffb000]" />}
                <Icon size={13} className={active ? "text-[#ffc94d]" : ""} />
                {t.label}
                {t.count && (
                  <span
                    className={cn(
                      "mono rounded-sm px-1 py-px text-[10px] font-bold",
                      t.tone === "good" && "bg-[#2a1f00] text-[#ffc94d]",
                      t.tone === "bad" && "bg-[#2d1217] text-[#ff5d6c]",
                      !t.tone && "bg-[#161b22] text-[#5a6573]",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!embedded && (
          <button
            onClick={() => setOpen(!open)}
            className="ml-auto inline-flex h-7 items-center gap-1 rounded-sm px-2 text-[11px] font-bold uppercase tracking-wider text-[#5a6573] hover:text-[#e1e2eb]"
            title={open ? "Collapse dock" : "Expand dock"}
          >
            {open ? <><ChevronDown size={12} /> Collapse</> : <><ChevronUp size={12} /> Expand</>}
          </button>
        )}
      </header>

      {(open || embedded) && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {tab === "evidence" && <div className="h-full"><EvidenceTable bare /></div>}
              {tab === "ai" && <div className="h-full overflow-auto"><AIFindings bare /></div>}
              {tab === "timeline" && <div className="h-full"><Timeline bare /></div>}
              {tab === "trends" && <div className="h-full overflow-auto"><ConfidenceChart bare /></div>}
              {tab === "alerts" && <div className="h-full"><RecentAlerts bare /></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}