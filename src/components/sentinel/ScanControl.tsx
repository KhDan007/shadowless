import { useEffect, useRef, useState } from "react";
import { Play, Radar, ChevronDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSentinelData } from "./store";
import {
  startScan, fetchTaskStatus, fetchGraph, fetchSignals, mapApiGraph,
  type ScanSource,
} from "@/lib/sentinelApi";
import { useI18n } from "@/i18n";

const SOURCES: { key: ScanSource; labelKey: string }[] = [
  { key: "telegram", labelKey: "scan.src.telegram" },
  { key: "darknet",  labelKey: "scan.src.darknet" },
  { key: "mock",     labelKey: "scan.src.mock" },
];

const MAX_POLL_MS = 120_000;

export function ScanControl() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("дроп");
  const [source, setSource] = useState<ScanSource>("telegram");
  const { t } = useI18n();
  const scan = useSentinelData((s) => s.scan);
  const beginScan = useSentinelData((s) => s.beginScan);
  const setStep = useSentinelData((s) => s.setStep);
  const failScan = useSentinelData((s) => s.failScan);
  const applyLive = useSentinelData((s) => s.applyLive);
  const setInvestigationId = useSentinelData((s) => s.setInvestigationId);
  const setTaskStatus = useSentinelData((s) => s.setTaskStatus);
  const setSignals = useSentinelData((s) => s.setSignals);
  const taskStatus = useSentinelData((s) => s.taskStatus);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  useEffect(() => () => { cancelRef.current.cancelled = true; }, []);

  const run = async () => {
    if (scan.active) return;
    setOpen(false);
    beginScan();
    cancelRef.current = { cancelled: false };
    const flag = cancelRef.current;
    try {
      setStep(t("scan.step.submitting"));
      const { task_id, investigation_id } = await startScan(target.trim() || "дроп", source);
      setInvestigationId(investigation_id);
      setStep(t("scan.step.queued"));
      const start = Date.now();
      while (!flag.cancelled) {
        if (Date.now() - start > MAX_POLL_MS) throw new Error(t("scan.err.timeout"));
        await new Promise((r) => setTimeout(r, 2000));
        if (flag.cancelled) return;
        const tk = await fetchTaskStatus(task_id);
        setTaskStatus(tk);
        if (tk.current_step) setStep(tk.current_step);
        if (tk.status === "done") break;
        if (tk.status === "error") throw new Error(tk.error || "scan errored");
      }
      if (flag.cancelled) return;
      setStep(t("scan.step.loading_graph"));
      const graph = await fetchGraph(investigation_id);
      const mapped = mapApiGraph(graph, source);
      applyLive(mapped);
      // best-effort signals fetch — does not block UX on failure
      fetchSignals(investigation_id)
        .then((s) => setSignals(s))
        .catch(() => { /* silent */ });
      toast.success(t("scan.toast.complete", { e: mapped.entities.length, l: mapped.edges.length }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failScan(msg);
      toast.error(msg.includes("Failed to fetch") || msg.includes("NetworkError") ? t("scan.err.offline") : `${t("scan.err.failed")} ${msg}`);
    }
  };

  if (scan.active) {
    const pct = Math.max(0, Math.min(100, Math.round(taskStatus?.progress ?? 0)));
    const eta = taskStatus?.eta_seconds;
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-sm border border-primary/50 bg-primary/20 px-3 text-[12.5px] font-bold text-primary sm:h-8">
        <Radar size={13} className="animate-spin" />
        <span className="hidden sm:inline truncate max-w-[180px]">{scan.step || t("scan.scanning")}</span>
        {pct > 0 && (
          <span className="mono hidden text-[11px] tabular-nums text-primary/80 sm:inline">{pct}%</span>
        )}
        {typeof eta === "number" && eta > 0 && (
          <span className="mono hidden text-[10.5px] tabular-nums text-muted-foreground md:inline">{t("task.eta")} {eta}s</span>
        )}
        <span className="hidden h-1 w-16 overflow-hidden rounded-sm border border-primary/40 bg-background sm:inline-block">
          <span className="block h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={t("scan.start.title")}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-[13px] font-bold tracking-wide text-primary-foreground hover:bg-primary sm:h-8",
            "signal-glow",
          )}
        >
          <Play size={12} fill="currentColor" />
          <span className="hidden sm:inline">{t("scan.start")}</span>
          <ChevronDown size={11} className="opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 border-border bg-secondary p-3 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("scan.label")}</div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground/80">
          {t("scan.field.query")}
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(); }}
            placeholder="дроп"
            className="mt-1 h-8 w-full rounded-sm border border-border bg-background px-2 text-[13px] font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground/80">
          {t("scan.field.source")}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as ScanSource)}
            className="mt-1 h-8 w-full rounded-sm border border-border bg-background px-2 text-[13px] font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary"
          >
            {SOURCES.map((s) => <option key={s.key} value={s.key}>{t(s.labelKey)}</option>)}
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
          <Play size={12} fill="currentColor" /> {t("scan.run")}
        </button>
        <p className="mono text-[10.5px] leading-snug text-muted-foreground">
          {t("scan.note")}
        </p>
      </PopoverContent>
    </Popover>
  );
}