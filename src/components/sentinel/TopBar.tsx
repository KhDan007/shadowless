import { Search, Download, Command, Bell, MoreHorizontal, Menu, ArrowRight, ShieldAlert, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSentinelData } from "./store";
import { ScanControl } from "./ScanControl";
import { createReport } from "@/lib/sentinelApi";
import { exportInvestigationPdf } from "@/lib/exportInvestigation";
import { useNotifications } from "./notificationsStore";
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

const RISK_KEYS = [
  { key: "top.risk.critical", risk: "critical", color: "var(--risk-critical)" },
  { key: "top.risk.high",     risk: "high",     color: "var(--risk-high)" },
  { key: "top.risk.medium",   risk: "medium",   color: "var(--risk-medium)" },
  { key: "top.risk.low",      risk: "low",      color: "var(--risk-low)" },
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
  const investigation = useSentinelData((s) => s.investigation);
  const entity = selectedId ? entities.find((e) => e.id === selectedId) : null;
  const isMobile = mode === "mobile";
  const { t } = useI18n();

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const notifications = useNotifications((s) => s.items);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const clearNotifications = useNotifications((s) => s.clear);
  const unreadCount = notifications.filter((n) => !n.read).length;
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
  const investigationId = useSentinelData((s) => s.investigationId);

  const riskBreakdown = RISK_KEYS.map((r) => ({
    ...r,
    count: entities.filter((e) => e.risk === r.risk).length,
  }));
  const criticalCount = riskBreakdown[0].count;
  const maxCount = Math.max(1, ...riskBreakdown.map((r) => r.count));
  const caseTag = investigation
    ? `#${investigation.id.slice(0, 8).toUpperCase()}`
    : "—";
  const caseTitle = investigation?.title ?? t("top.case.title");

  const exportReport = async () => {
    const state = useSentinelData.getState();
    if (!state.entities.length && !investigationId) {
      return toast.error(t("top.toast.no_report"));
    }
    try {
      const fname = exportInvestigationPdf({
        investigation: state.investigation,
        entities: state.entities,
        edges: state.edges,
        signals: state.signals,
        logRows: state.logRows,
      });
      toast.success(t("top.toast.exported", { id: fname }));
      if (investigationId) {
        // Best-effort: also register a report server-side; ignore failures.
        createReport(investigationId).catch(() => undefined);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
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
        <span className="mono shrink-0 text-[14px] font-bold text-primary">{caseTag}</span>
        <span className="hidden truncate text-[14px] font-semibold text-foreground lg:inline">{caseTitle}</span>
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
        {/* Notifications bell (top-right popup) */}
        <Popover onOpenChange={(o) => { if (o) markAllRead(); }}>
          <PopoverTrigger asChild>
            <button
              title={t("top.alerts")}
              aria-label={t("top.alerts")}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary sm:h-8 sm:w-8"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 mono inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 border-border bg-secondary p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("top.alerts")}</div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
                >
                  {t("notif.clear")}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">—</div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((n) => (
                    <li key={n.id} className="flex gap-2 px-3 py-2">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background:
                            n.level === "crit" ? "var(--risk-critical)"
                            : n.level === "warn" ? "var(--risk-medium)"
                            : n.level === "ok" ? "var(--risk-low)"
                            : "var(--muted-foreground)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-foreground">{n.title}</div>
                        {n.desc && <div className="truncate text-[11.5px] text-muted-foreground">{n.desc}</div>}
                        <div className="mono mt-0.5 text-[10.5px] text-muted-foreground">
                          {new Date(n.ts).toLocaleTimeString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              title={t("top.risk.dist")}
              aria-label={t("top.risk.dist")}
              className="relative hidden h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary sm:inline-flex sm:h-8 sm:w-8"
            >
              <PieChart size={14} />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 mono inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{criticalCount}</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 border-border bg-secondary p-3">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("top.risk.dist")}</div>
              <span className="mono text-[11px] text-muted-foreground">{entities.length} {t("top.risk.entities")}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {riskBreakdown.map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  <span className="flex-1 text-[12.5px] text-foreground/80">{t(r.key)}</span>
                  <div className="h-1 w-20 overflow-hidden rounded bg-background">
                    <div className="h-full" style={{ width: `${(r.count / maxCount) * 100}%`, background: r.color }} />
                  </div>
                  <span className="mono w-6 text-right text-[12px] font-semibold text-foreground">{r.count}</span>
                </div>
              ))}
              {entities.length === 0 && (
                <div className="mono pt-1 text-center text-[11px] text-muted-foreground">—</div>
              )}
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
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-destructive" aria-hidden />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-secondary text-foreground/80">
            <DropdownMenuItem onClick={openAlerts} className="gap-2 text-[13px]">
              <Bell size={13} /> {t("top.alerts")}
              {criticalCount > 0 && (
                <span className="ml-auto mono rounded-sm bg-destructive/15 px-1 text-[10px] font-bold text-destructive">{criticalCount}</span>
              )}
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