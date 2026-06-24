import { Search, Download, Command, Bell, MoreHorizontal, Menu, ArrowRight, ShieldAlert, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { RiskBadge } from "./atoms";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSentinelData } from "./store";
import { ScanControl } from "./ScanControl";
import { REPORTS } from "./data";
import { downloadReportPdf } from "@/lib/generateReportPdf";
import type { LayoutMode } from "./useLayout";

const RISK_BREAKDOWN = [
  { label: "Critical", count: 3,  color: "var(--risk-critical)" },
  { label: "High",     count: 6,  color: "var(--risk-high)" },
  { label: "Medium",   count: 9,  color: "var(--risk-medium)" },
  { label: "Low",      count: 12, color: "var(--risk-low)" },
];

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

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openAlerts = () => {
    try { sessionStorage.setItem("sentinel.pendingDockTab", "alerts"); } catch {}
    if (pathname !== "/") {
      navigate({ to: "/" }).then(() => {
        // dock mounts on "/"; event reaches it once mounted
        window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: "alerts" }));
      });
    } else {
      window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: "alerts" }));
    }
    toast("Alerts panel opened");
  };
  const exportReport = () => {
    const r = REPORTS[0];
    if (!r) return toast.error("No report available");
    downloadReportPdf(r);
    toast.success(`Exported ${r.id}.pdf`);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:px-4 sm:gap-3">
      {/* Mobile sidebar trigger */}
      {isMobile && (
        <button
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground/80"
          aria-label="Open navigation"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Case chip */}
      <div className="flex min-w-0 items-center gap-2" title="Active case file. All actions on this screen apply to this investigation.">
        {!isMobile && <div className="mono hidden text-[11px] tracking-[0.16em] text-muted-foreground sm:block">CASE</div>}
        <span className="mono shrink-0 text-[14px] font-bold text-primary" title="Internal case number">#KZ-2048</span>
        <span className="hidden truncate text-[14px] font-semibold text-foreground lg:inline">Digital Network Investigation</span>
      </div>

      {/* Global search */}
      <div className={cn("min-w-0 flex-1", isMobile ? "max-w-none" : "ml-2 max-w-xl")}>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("sentinel:open-command"))}
          className="group relative flex h-9 w-full items-center rounded-sm border border-border bg-background pl-8 pr-2 text-left text-[13.5px] text-muted-foreground transition hover:border-primary hover:text-foreground sm:h-8 sm:pr-16"
          aria-label="Open command palette"
          title="Open the operator console — search entities, evidence, reports, actions"
        >
          <Search size={14} className="absolute left-2.5 text-muted-foreground group-hover:text-primary" />
          <span className="truncate">{isMobile ? "Search…" : "Search entities, evidence, actions…"}</span>
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
              title="Open the full investigation timeline for the selected entity"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-[13px] font-bold tracking-wide text-primary-foreground hover:bg-primary sm:h-8",
                "signal-glow",
              )}
            >
              <ShieldAlert size={13} />
              <span className="hidden sm:inline">INVESTIGATE</span>
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
              title="Case risk distribution"
              aria-label="Risk distribution"
              className="relative hidden h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary sm:inline-flex sm:h-8 sm:w-8"
            >
              <PieChart size={14} />
              <span className="absolute -top-1 -right-1 mono inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">3</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 border-border bg-secondary p-3">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Risk distribution</div>
              <span className="mono text-[11px] text-muted-foreground">47 entities</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {RISK_BREAKDOWN.map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  <span className="flex-1 text-[12.5px] text-foreground/80">{r.label}</span>
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
              aria-label="More actions"
              title="Actions"
            >
              <MoreHorizontal size={14} />
              <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-destructive" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-secondary text-foreground/80">
            <DropdownMenuItem onClick={openAlerts} className="gap-2 text-[13px]">
              <Bell size={13} /> Alerts
              <span className="ml-auto mono rounded-sm bg-destructive/15 px-1 text-[10px] font-bold text-destructive">3</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportReport} className="gap-2 text-[13px]">
              <Download size={13} /> Export report
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-muted" />
            <DropdownMenuItem
              onClick={() => window.dispatchEvent(new CustomEvent("sentinel:open-command"))}
              className="gap-2 text-[13px]"
            >
              <Command size={13} /> Command palette
              <kbd className="ml-auto mono text-[10px] text-muted-foreground">⌘K</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}