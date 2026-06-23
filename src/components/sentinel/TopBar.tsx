import { useEffect, useState } from "react";
import { Search, Radar, Download, Play, Command, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RiskBadge } from "./atoms";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(34);

  useEffect(() => {
    if (!scanning) return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(id); setScanning(false); toast.success("Scan complete · 14 new relationships detected"); return 100; }
        return p + 4;
      });
    }, 110);
    return () => clearInterval(id);
  }, [scanning]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#1f2630] bg-[#0b0e14] px-4">
      <div className="flex items-center gap-2 min-w-0">
        <div className="mono text-[10px] tracking-[0.16em] text-[#5a6573]">CASE</div>
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="mono text-[13px] font-bold text-[#4edea3]">#KZ-2048</span>
          <span className="hidden md:inline text-[13px] font-semibold text-[#e1e2eb] truncate">Digital Network Investigation</span>
        </div>
        <RiskBadge risk="critical" className="ml-1" />
      </div>

      {/* Global search */}
      <div className="ml-4 flex-1 max-w-xl">
        <div className="group relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-[#5a6573]" />
          <input
            placeholder="Search entities, wallets, hashes, channels…"
            className="h-8 w-full rounded-sm border border-[#1f2630] bg-[#0d1117] pl-8 pr-16 text-[12.5px] text-[#e1e2eb] placeholder:text-[#5a6573] outline-none transition focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
          />
          <kbd className="absolute right-2 mono text-[10px] text-[#5a6573] inline-flex items-center gap-1 rounded border border-[#1f2630] bg-[#161b22] px-1.5 py-0.5">
            <Command size={10} /> K
          </kbd>
        </div>
      </div>

      {/* Scan status */}
      <div className="hidden lg:flex items-center gap-2 rounded-sm border border-[#1f2630] bg-[#0d1117] px-2.5 py-1">
        <div className="relative h-2 w-2">
          <span className={cn("absolute inset-0 rounded-full", scanning ? "bg-[#4edea3]" : "bg-[#3c4a42]")} />
          {scanning && <span className="absolute inset-0 rounded-full bg-[#4edea3] animate-ping" />}
        </div>
        <span className="mono text-[10.5px] uppercase tracking-wider text-[#bbcabf]">
          {scanning ? `Scanning · ${progress}%` : "Idle · last 14:22"}
        </span>
      </div>

      {/* Risk legend */}
      <div className="hidden xl:flex items-center gap-1">
        <RiskPill label="Low" count={12} tone="low" />
        <RiskPill label="Med" count={9} tone="medium" />
        <RiskPill label="High" count={6} tone="high" />
        <RiskPill label="Crit" count={3} tone="critical" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => toast("Alerts panel opened")}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#1f2630] bg-[#0d1117] text-[#bbcabf] hover:border-[#30363d] hover:text-[#e1e2eb]"
          aria-label="Alerts"
        >
          <Bell size={14} />
          <span className="absolute -top-1 -right-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#ff5d6c] px-1 text-[9px] font-bold text-[#2d1217]">3</span>
        </button>
        <button
          onClick={() => toast("Report queued for export")}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-[#1f2630] bg-[#0d1117] px-2.5 text-[12px] font-semibold text-[#bbcabf] hover:border-[#30363d] hover:text-[#e1e2eb]"
        >
          <Download size={13} /> Export Report
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setScanning(true)}
          disabled={scanning}
          className={cn(
            "relative overflow-hidden inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-[12px] font-bold tracking-wide text-[#00251a]",
            "bg-[#10b981] hover:bg-[#0fcb91] disabled:opacity-70",
            "shadow-[0_0_0_1px_rgba(78,222,163,0.5),0_0_18px_rgba(16,185,129,0.35)]"
          )}
        >
          {scanning ? <Radar size={13} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
          {scanning ? "SCANNING…" : "START SCAN"}
        </motion.button>
      </div>
    </header>
  );
}

function RiskPill({ label, count, tone }: { label: string; count: number; tone: "low" | "medium" | "high" | "critical" }) {
  const map = {
    low: "text-[#4edea3] border-[#1c3a30]",
    medium: "text-[#f5b850] border-[#3a2e16]",
    high: "text-[#ff8a4c] border-[#3a2616]",
    critical: "text-[#ff5d6c] border-[#3a1820]",
  }[tone];
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-sm border bg-[#0d1117] px-2 py-1", map)}>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <span className="mono text-[11px] font-semibold">{count}</span>
    </div>
  );
}