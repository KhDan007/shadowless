import { Search, Download, Command, Bell, MoreHorizontal, Menu, ArrowRight, ShieldAlert, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSentinelData } from "./store";
import { ScanControl } from "./ScanControl";
import { useSentinelData } from "./store";
import { createReport } from "@/lib/sentinelApi";
import type { LayoutMode } from "./useLayout";
import { useI18n } from "@/i18n";

function DemoBadge() {
  const isDemo = useSentinelData((s) => s.isDemo);
  const { t } = useI18n();
  if (!isDemo) return null;
  return (
    <span
      title={t("top.demo.tooltip")}
      className="mono ml-1 hidden shrink-0 items-center gap-1 rounded-sm border border-[color:var(--risk-medium)]/40 bg-[color:var(--risk-medium)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--risk-medium)] sm:inline-flex"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--risk-medium)]" />
      {t("top.demo.badge")}
    </span>
  );
}

const RISK_BREAKDOWN = [
  { key: "top.risk.critical", count: 3,  color: "var(--risk-critical)" },
  { key: "top.risk.high",     count: 6,  color: "var(--risk-high)" },
  { key: "top.risk.medium",   count: 9,  color: "var(--risk-medium)" },
  { key: "top.risk.low",      count: 12, color: "var(--risk-low)" },
] as const;

export function TopBar({
  selectedId,
  onInvestigate,
  onOpenSidebar,
  mode,
}: {
  selectedId: string | null;
  onInvestigate?: () => void;
  onOpenSidebar?: () => void;
  mode: LayoutMode;
}) {
  const entities = useSentinelData((s) => s.entities);
  const entity = selectedId ? entities.find((e) => e.id === selectedId) : null;
  const isMobile = mode === "mobile";
  const { t } = useI18n();

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openAlerts = () => {
    try { sessionStorage.setItem("sentinel.pendingDockTab", "alerts"); } catch {}
    if (pathname !== "/workspace") {
      navigate({ to: "/workspace" }).then(() => {
        // dock mounts on "/"; event reaches it once mounted
        window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: "alerts" }));
      });
    } else {
      window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: "alerts" }));
    }
    toast(t("top.toast.alerts_opened"));
  };
  const exportReport = () => {
    const r = REPORTS[0];
    if (!r) return toast.error(t("top.toast.no_report"));
    downloadReportPdf(r);
    toast.success(t("top.toast.exported", { id: r.id }));
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:px-4 sm:gap-3">
      {/* Mobile sidebar trigger */}
      {isMobile && (
        <button
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground/80"
          aria-label={t("mob.open_nav")}
        >
          <Menu size={16} />
        </button>
      )}

      {/* Case chip */}
      <div className="flex min-w-0 items-center gap-2">
        {!isMobile && <div className="mono hidden text-[11px] tracking-[0.16em] text-muted-foreground sm:block">{t("top.case")}</div>}
        <span className="mono shrink-0 text-[14px] font-bold text-primary">#KZ-2048</span>
        <span className="hidden truncate text-[14px] font-semibold text-foreground lg:inline">{t("top.case.title")}</span>
        <DemoBadge />
      </div>

      {/* Global search */}
      <div className={cn("min-w-0 flex-1", isMobile ? "max-w-none" : "ml-2 max-w-xl")}>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("sentinel:open-command"))}
          className="group relative flex h-9 w-full items-center rounded-sm border border-border bg-background pl-8 pr-2 text-left text-[13.5px] text-muted-foreground transition hover:border-primary hover:text-foreground sm:h-8 sm:pr-16"
          aria-label={t("top.command")}
          title={t("top.command")}
        >
          <Search size={14} className="absolute left-2.5 text-muted-foreground group-hover:text-primary" />
          <span className="truncate">{isMobile ? t("top.search.short") : t("top.search.placeholder")}</span>
          <kbd className="absolute right-2 mono hidden items-center gap-1 rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
            <Command size={10} /> K
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Morphing primary CTA */}
        <AnimatePresence mode="wait" initial={false}>
          {entity ? (
            <motion.button
              key="investigate"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              whileTap={{ scale: 0.97 }}
              onClick={onInvestigate}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-[13px] font-bold tracking-wide text-primary-foreground hover:bg-primary sm:h-8",
                "signal-glow",
              )}
            >
              <ShieldAlert size={13} />
              <span className="hidden sm:inline">{t("top.investigate")}</span>
              <ArrowRight size={12} />
            </motion.button>
          ) : (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <ScanControl />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single consolidated overflow — replaces alerts bell, export, risk pill */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              title={t("top.risk.dist")}
              aria-label={t("top.risk.dist")}
              className="relative hidden h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary sm:inline-flex sm:h-8 sm:w-8"
            >
              <PieChart size={14} />
              <span className="absolute -top-1 -right-1 mono inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">3</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 border-border bg-secondary p-3">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("top.risk.dist")}</div>
              <span className="mono text-[11px] text-muted-foreground">47 {t("top.risk.entities")}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {RISK_BREAKDOWN.map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  <span className="flex-1 text-[12.5px] text-foreground/80">{t(r.key)}</span>
                  <div className="h-1 w-20 overflow-hidden rounded bg-background">
                    <div className="h-full" style={{ width: `${(r.count / 12) * 100}%`, background: r.color }} />
                  </div>
                  <span className="mono w-6 text-right text-[12px] font-semibold text-foreground">{r.count}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary sm:h-8 sm:w-8"
              aria-label={t("top.more")}
              title={t("top.more")}
            >
              <MoreHorizontal size={14} />
              <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-destructive" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-secondary text-foreground/80">
            <DropdownMenuItem onClick={openAlerts} className="gap-2 text-[13px]">
              <Bell size={13} /> {t("top.alerts")}
              <span className="ml-auto mono rounded-sm bg-destructive/15 px-1 text-[10px] font-bold text-destructive">3</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportReport} className="gap-2 text-[13px]">
              <Download size={13} /> {t("top.export_report")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-muted" />
            <DropdownMenuItem
              onClick={() => window.dispatchEvent(new CustomEvent("sentinel:open-command"))}
              className="gap-2 text-[13px]"
            >
              <Command size={13} /> {t("top.command")}
              <kbd className="ml-auto mono text-[10px] text-muted-foreground">⌘K</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}