import { useEffect, useRef, useState } from "react";
import { Play, Radar, ChevronDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSentinelData } from "./store";
import { startScan, fetchTask, fetchGraph, mapApiGraph, type ScanSource } from "@/lib/sentinelApi";

const SOURCES: { key: ScanSource; label: string }[] = [
  { key: "telegram", label: "Telegram" },
  { key: "darknet",  label: "DarkNet" },
  { key: "mock",     label: "Demo" },
];

const MAX_POLL_MS = 120_000;

export function ScanControl() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("дроп");
  const [source, setSource] = useState<ScanSource>("telegram");
  const scan = useSentinelData((s) => s.scan);
  const beginScan = useSentinelData((s) => s.beginScan);
  const setStep = useSentinelData((s) => s.setStep);
  const failScan = useSentinelData((s) => s.failScan);
  const applyLive = useSentinelData((s) => s.applyLive);
  const setInvestigationId = useSentinelData((s) => s.setInvestigationId);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  useEffect(() => () => { cancelRef.current.cancelled = true; }, []);

  const run = async () => {
    if (scan.active) return;
    setOpen(false);
    beginScan();
    cancelRef.current = { cancelled: false };
    const flag = cancelRef.current;
    try {
      setStep("submitting");
      const { task_id, investigation_id } = await startScan(target.trim() || "дроп", source);
      setInvestigationId(investigation_id);
      setStep("queued");
      const start = Date.now();
      while (!flag.cancelled) {
        if (Date.now() - start > MAX_POLL_MS) throw new Error("scan timed out");
        await new Promise((r) => setTimeout(r, 1000));
        if (flag.cancelled) return;
        const t = await fetchTask(task_id);
        if (t.current_step) setStep(t.current_step);
        if (t.status === "done") break;
        if (t.status === "error") throw new Error(t.error || "scan errored");
      }
      if (flag.cancelled) return;
      setStep("loading graph");
      const graph = await fetchGraph(investigation_id);
      const mapped = mapApiGraph(graph, source);
      applyLive(mapped);
      toast.success(`Scan complete · ${mapped.entities.length} entities · ${mapped.edges.length} links`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failScan(msg);
      toast.error(msg.includes("Failed to fetch") || msg.includes("NetworkError") ? "backend offline" : `scan failed: ${msg}`);
    }
  };

  if (scan.active) {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-sm border border-primary/50 bg-primary/20 px-3 text-[12.5px] font-bold text-primary sm:h-8">
        <Radar size={13} className="animate-spin" />
        <span className="hidden sm:inline truncate max-w-[160px]">{scan.step || "scanning…"}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title="Run a live scan against the OSINT backend"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-[13px] font-bold tracking-wide text-primary-foreground hover:bg-primary sm:h-8",
            "signal-glow",
          )}
        >
          <Play size={12} fill="currentColor" />
          <span className="hidden sm:inline">START SCAN</span>
          <ChevronDown size={11} className="opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 border-border bg-secondary p-3 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Live scan</div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground/80">
          Query
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(); }}
            placeholder="дроп"
            className="mt-1 h-8 w-full rounded-sm border border-border bg-background px-2 text-[13px] font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground/80">
          Source
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as ScanSource)}
            className="mt-1 h-8 w-full rounded-sm border border-border bg-background px-2 text-[13px] font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary"
          >
            {SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        {scan.error && (
          <div className="flex items-start gap-1.5 rounded-sm border border-destructive/40 bg-destructive/15 p-1.5 text-[11.5px] text-destructive">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span className="break-all">{scan.error}</span>
          </div>
        )}
        <button
          onClick={run}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-primary px-3 text-[13px] font-bold tracking-wide text-primary-foreground hover:bg-primary"
        >
          <Play size={12} fill="currentColor" /> RUN SCAN
        </button>
        <p className="mono text-[10.5px] leading-snug text-muted-foreground">
          POST /api/v1/scan → poll task → load graph. Live data overrides graph, entity panel and evidence log.
        </p>
      </PopoverContent>
    </Popover>
  );
}