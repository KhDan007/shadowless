import { Search, Download, Command, Bell, MoreHorizontal, Menu, ArrowRight, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  { label: "Critical", count: 3, color: "#ff5d6c" },
  { label: "High",     count: 6, color: "#ff8a4c" },
  { label: "Medium",   count: 9, color: "#f5b850" },
  { label: "Low",      count: 12, color: "#ffc94d" },
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
  const isCompact = mode === "mobile" || mode === "tablet";

  const openAlerts = () => {
    window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: "alerts" }));
    toast("Alerts panel opened");
  };
  const exportReport = () => {
    const r = REPORTS[0];
    if (!r) return toast.error("No report available");
    downloadReportPdf(r);
    toast.success(`Exported ${r.id}.pdf`);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#1f2630] bg-[#0b0e14] px-3 sm:px-4 sm:gap-3">
      {/* Mobile sidebar trigger */}
      {isMobile && (
        <button
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#b8b8b8]"
          aria-label="Open navigation"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Case chip */}
      <div className="flex min-w-0 items-center gap-2" title="Active case file. All actions on this screen apply to this investigation.">
        {!isMobile && <div className="mono hidden text-[11px] tracking-[0.16em] text-[#5a6573] sm:block">CASE</div>}
        <span className="mono shrink-0 text-[14px] font-bold text-[#ffc94d]" title="Internal case number">#KZ-2048</span>
        <span className="hidden truncate text-[14px] font-semibold text-[#e1e2eb] lg:inline">Digital Network Investigation</span>
        <RiskBadge risk="critical" className="hidden sm:inline-flex" />
      </div>

      {/* Global search */}
      <div className={cn("min-w-0 flex-1", isMobile ? "max-w-none" : "ml-2 max-w-xl")}>
        <div className="group relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-[#5a6573]" />
          <input
            placeholder={isMobile ? "Search…" : "Search entities, wallets, hashes…"}
            className="h-9 w-full rounded-sm border border-[#1f2630] bg-[#0d1117] pl-8 pr-2 text-[13.5px] text-[#e1e2eb] placeholder:text-[#5a6573] outline-none transition focus:border-[#ffb000] focus:ring-1 focus:ring-[#ffb000] sm:h-8 sm:pr-16"
          />
          <kbd className="absolute right-2 mono hidden items-center gap-1 rounded border border-[#1f2630] bg-[#161b22] px-1.5 py-0.5 text-[11px] text-[#5a6573] sm:inline-flex">
            <Command size={10} /> K
          </kbd>
        </div>
      </div>

      {/* Composite risk chip (replaces 4 separate pills) */}
      <Popover>
        <PopoverTrigger asChild>
          <button title="Entities tracked in this case and how many are flagged as critical risk. Click for full breakdown." className="hidden h-8 items-center gap-2 rounded-sm border border-[#1f2630] bg-[#0d1117] px-2 text-[12px] text-[#b8b8b8] hover:border-[#30363d] hover:text-[#e1e2eb] md:inline-flex">
            <span className="mono text-[13px] font-bold text-[#e1e2eb]">47</span>
            <span className="text-[11.5px]">entities</span>
            <span className="mx-1 h-3 w-px bg-[#1f2630]" />
            <span className="mono text-[13px] font-bold text-[#ff5d6c]">3</span>
            <span className="text-[11.5px] text-[#ff5d6c]">critical</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 border-[#1f2630] bg-[#161b22] p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5a6573]">Risk distribution</div>
          <div className="mt-2 space-y-1.5">
            {RISK_BREAKDOWN.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                <span className="flex-1 text-[12.5px] text-[#b8b8b8]">{r.label}</span>
                <div className="h-1 w-20 overflow-hidden rounded bg-[#0d1117]">
                  <div className="h-full" style={{ width: `${(r.count / 12) * 100}%`, background: r.color }} />
                </div>
                <span className="mono w-6 text-right text-[12px] font-semibold text-[#e1e2eb]">{r.count}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

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
                "inline-flex h-9 items-center gap-1.5 rounded-sm bg-[#ffb000] px-3 text-[13px] font-bold tracking-wide text-[#1a1200] hover:bg-[#ffc94d] sm:h-8",
                "shadow-[0_0_0_1px_rgba(255,201,77,0.5),0_0_18px_rgba(255,176,0,0.35)]",
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

        {/* Overflow menu (compact) / inline (xl) */}
        {isCompact ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#b8b8b8] hover:border-[#30363d] hover:text-[#e1e2eb] sm:h-8 sm:w-8" aria-label="More">
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-[#1f2630] bg-[#161b22] text-[#b8b8b8]">
              <DropdownMenuItem onClick={openAlerts} className="gap-2 text-[13px]">
                <Bell size={13} /> Alerts <span className="ml-auto mono rounded-sm bg-[#2d1217] px-1 text-[10px] font-bold text-[#ff5d6c]">3</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportReport} className="gap-2 text-[13px]">
                <Download size={13} /> Export Report
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1f2630]" />
              <DropdownMenuItem className="gap-2 text-[13px]">
                <Command size={13} /> Command palette <kbd className="ml-auto mono text-[10px] text-[#5a6573]">⌘K</kbd>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <button
              onClick={openAlerts}
              title="System alerts — new high-risk findings and case updates"
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#b8b8b8] hover:border-[#30363d] hover:text-[#e1e2eb]"
              aria-label="Alerts"
            >
              <Bell size={14} />
              <span className="absolute -top-1 -right-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#ff5d6c] px-1 text-[10px] font-bold text-[#2d1217]">3</span>
            </button>
            <button
              onClick={exportReport}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-[#1f2630] bg-[#0d1117] px-2.5 text-[13px] font-semibold text-[#b8b8b8] hover:border-[#30363d] hover:text-[#e1e2eb]"
            >
              <Download size={13} /> Export
            </button>
          </>
        )}
      </div>
    </header>
  );
}