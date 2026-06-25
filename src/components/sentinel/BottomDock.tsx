import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileSearch, Activity, Bell, MoreHorizontal, Terminal } from "lucide-react";
import { EvidenceTable, ConfidenceChart, RecentAlerts } from "./BottomPanels";
import { AgentConsole } from "./AgentConsole";
import { cn } from "@/lib/utils";
import { usePersistentBool } from "./useLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n";

type TabKey = "evidence" | "trends" | "alerts" | "console";

type TabDef = { key: TabKey; labelKey: string; icon: any; count?: string; countKey?: string; tone?: "good" | "warn" | "bad" };
const PRIMARY_TABS: TabDef[] = [
  { key: "evidence", labelKey: "dock.tab.evidence", icon: FileSearch },
  { key: "console",  labelKey: "dock.tab.console",  icon: Terminal,   tone: "good" },
  { key: "alerts",   labelKey: "dock.tab.alerts",   icon: Bell,       tone: "bad" },
];
const SECONDARY_TABS: TabDef[] = [
  { key: "trends",   labelKey: "dock.tab.trends",   icon: Activity },
];
const TABS: TabDef[] = [...PRIMARY_TABS, ...SECONDARY_TABS];

export function BottomDock({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<TabKey>("evidence");
  const [open, setOpen] = usePersistentBool("sentinel.dock.open", true);
  const { t } = useI18n();

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
                {/* eslint-disable-next-line @typescript-eslint/no-shadow */}
                <DockTabLabel labelKey={t.labelKey} />
                {t.count && (
                  <span
                    className={cn(
                      "mono rounded-sm px-1 py-px text-[10px] font-bold",
                      t.tone === "good" && "bg-primary/15 text-primary",
                      t.tone === "bad" && "bg-destructive/15 text-destructive",
                      !t.tone && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {t.countKey ? <DockTabCount k={t.countKey} n={t.count} /> : t.count}
                  </span>
                )}
              </button>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-sm px-2 text-[12px] font-semibold text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
                title={t("dock.more_panels")}
                aria-label={t("dock.more_panels")}
              >
                <MoreHorizontal size={13} /> {t("dock.more")}
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
                    <Icon size={13} /> <DockTabLabel labelKey={t.labelKey} />
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
            title={open ? t("dock.collapse") : t("dock.expand")}
          >
            {open ? <><ChevronDown size={12} /> {t("dock.collapse")}</> : <><ChevronUp size={12} /> {t("dock.expand")}</>}
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
              {tab === "trends" && <div className="h-full overflow-auto"><ConfidenceChart bare /></div>}
              {tab === "alerts" && <div className="h-full"><RecentAlerts bare /></div>}
              {tab === "console" && <div className="h-full"><AgentConsole bare /></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function DockTabLabel({ labelKey }: { labelKey: string }) {
  const { t } = useI18n();
  return <>{t(labelKey)}</>;
}
function DockTabCount({ k, n }: { k: string; n?: string }) {
  const { t } = useI18n();
  return <>{t(k, { n: n ?? "" })}</>;
}