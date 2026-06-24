import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileSearch, Brain, Activity, Bell, History, MoreHorizontal } from "lucide-react";
import { EvidenceTable, AIFindings, ConfidenceChart, RecentAlerts } from "./BottomPanels";
import { Timeline } from "./Timeline";
import { cn } from "@/lib/utils";
import { usePersistentBool } from "./useLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type TabKey = "evidence" | "ai" | "trends" | "alerts" | "timeline";

type TabDef = { key: TabKey; label: string; icon: any; count?: string; tone?: "good" | "warn" | "bad" };
const PRIMARY_TABS: TabDef[] = [
  { key: "evidence", label: "Evidence",   icon: FileSearch, count: "10" },
  { key: "ai",       label: "AI Findings", icon: Brain,     count: "14 new", tone: "good" },
  { key: "alerts",   label: "Alerts",      icon: Bell,      count: "3", tone: "bad" },
];
const SECONDARY_TABS: TabDef[] = [
  { key: "timeline", label: "Timeline",    icon: History,   count: "16" },
  { key: "trends",   label: "Trends",      icon: Activity },
];
const TABS: TabDef[] = [...PRIMARY_TABS, ...SECONDARY_TABS];

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

  // Pick up a pending tab requested before this component mounted (e.g.
  // user clicked "Alerts" on /reports, which then navigated to "/").
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("sentinel.pendingDockTab") as TabKey | null;
      if (pending && TABS.some((t) => t.key === pending)) {
        setTab(pending);
        setOpen(true);
      }
      sessionStorage.removeItem("sentinel.pendingDockTab");
    } catch {}
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded border border-border bg-card",
        embedded ? "flex-1 min-h-0" : open ? "h-[300px] shrink-0" : "h-9 shrink-0",
      )}
    >
      <header className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-background px-1.5">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {PRIMARY_TABS.concat(
            SECONDARY_TABS.filter((t) => t.key === tab),
          ).map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); if (!open) setOpen(true); }}
                className={cn(
                  "relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-[12.5px] font-semibold transition-colors",
                  active ? "bg-secondary text-foreground" : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {active && <span className="absolute inset-x-2 -bottom-px h-[1.5px] rounded-full bg-primary " />}
                <Icon size={13} className={active ? "text-primary" : ""} />
                {t.label}
                {t.count && (
                  <span
                    className={cn(
                      "mono rounded-sm px-1 py-px text-[10px] font-bold",
                      t.tone === "good" && "bg-primary/15 text-primary",
                      t.tone === "bad" && "bg-destructive/15 text-destructive",
                      !t.tone && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-sm px-2 text-[12px] font-semibold text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
                title="More panels"
                aria-label="More panels"
              >
                <MoreHorizontal size={13} /> More
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 border-border bg-secondary text-foreground/80">
              {SECONDARY_TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <DropdownMenuItem
                    key={t.key}
                    onClick={() => { setTab(t.key); if (!open) setOpen(true); }}
                    className="gap-2 text-[13px]"
                  >
                    <Icon size={13} /> {t.label}
                    {t.count && <span className="ml-auto mono text-[10.5px] text-muted-foreground">{t.count}</span>}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {!embedded && (
          <button
            onClick={() => setOpen(!open)}
            className="ml-auto inline-flex h-7 items-center gap-1 rounded-sm px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
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