import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, Bell, Brain, CheckCircle2, ChevronRight, Database,
  Download, FileText, Filter, Gauge, Layers, Network, Play, Radar, Radio,
  ScanLine, Share2, ShieldAlert, Signal, Sparkles, Target, Users, Waves, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  DEMO_METRICS, DEMO_SOURCES, PIPELINE_STEPS, SCAN_PHASES, CONFIDENCE_SERIES,
  SOURCE_DISTRIBUTION, RISK_TIMELINE, ENTITIES, KEYWORD_CLUSTERS, ALERTS,
  SIGNALS_FEED, GENERATED_SUMMARY, KEY_FINDINGS, NEXT_ACTIONS,
} from "@/data/demoData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shadowless · Live Demo" },
      { name: "description", content: "Cinematic walkthrough of the Shadowless AI intelligence workspace for investigators — simulated data only." },
      { property: "og:title", content: "Shadowless · Live Demo" },
      { property: "og:description", content: "AI intelligence workspace for investigators. Watch a 90-second guided demo." },
    ],
  }),
  component: DemoPage,
});

/* ─────────────────────────────────────────────────────────────────────────── */

type Stage = "idle" | "scanning" | "pipeline" | "dashboard" | "brief";

function DemoPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set());
  const [pipelineIdx, setPipelineIdx] = useState(-1);
  const reduce = useReducedMotion();

  const dashRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);

  const runDemo = () => {
    if (stage !== "idle" && stage !== "brief") return;
    setStage("scanning");
    setProgress(0);
    setPhaseIdx(0);
    setActiveSources(new Set());
    setPipelineIdx(-1);
  };

  // Scanning phase — light up sources, advance phases, drive progress
  useEffect(() => {
    if (stage !== "scanning") return;
    const start = performance.now();
    const DURATION = reduce ? 1500 : 5200;

    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setProgress(Math.round(p * 60)); // scanning fills 0 → 60%
      const phase = Math.min(SCAN_PHASES.length - 1, Math.floor(p * (SCAN_PHASES.length - 1)));
      setPhaseIdx(phase);

      // light up sources progressively
      const lit = Math.floor(p * DEMO_SOURCES.length);
      setActiveSources(new Set(DEMO_SOURCES.slice(0, lit + 1).map((s) => s.id)));

      if (p < 1) raf = requestAnimationFrame(tick);
      else setStage("pipeline");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, reduce]);

  // Pipeline phase — activate steps in sequence, drive progress to 100
  useEffect(() => {
    if (stage !== "pipeline") return;
    const stepMs = reduce ? 120 : 360;
    let i = 0;
    setPipelineIdx(0);
    const id = window.setInterval(() => {
      i += 1;
      if (i >= PIPELINE_STEPS.length) {
        window.clearInterval(id);
        setPipelineIdx(PIPELINE_STEPS.length - 1);
        setProgress(100);
        setStage("dashboard");
        return;
      }
      setPipelineIdx(i);
      setProgress(60 + Math.round((i / PIPELINE_STEPS.length) * 40));
    }, stepMs);
    return () => window.clearInterval(id);
  }, [stage, reduce]);

  // Reveal brief shortly after dashboard appears
  useEffect(() => {
    if (stage !== "dashboard") return;
    const t = window.setTimeout(() => setStage("brief"), reduce ? 400 : 2200);
    return () => window.clearTimeout(t);
  }, [stage, reduce]);

  // Auto-scroll into each section as it activates
  useEffect(() => {
    if (stage === "dashboard") dashRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (stage === "brief")     briefRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage]);

  const running = stage !== "idle";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#06090a] text-foreground">
      <BackgroundFX />
      <DemoNav stage={stage} progress={progress} onRun={runDemo} />

      <CommandCenter stage={stage} progress={progress} phase={SCAN_PHASES[phaseIdx]} onRun={runDemo} running={running} />

      <SourceScanningAnimation
        active={stage === "scanning" || stage === "pipeline" || stage === "dashboard" || stage === "brief"}
        scanning={stage === "scanning"}
        activeSources={activeSources}
        phase={SCAN_PHASES[phaseIdx]}
      />

      <IntelligencePipeline activeIdx={stage === "idle" ? -1 : (stage === "scanning" ? -1 : pipelineIdx)} />

      <div ref={dashRef}>
        <AnimatePresence>
          {(stage === "dashboard" || stage === "brief") && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnalyticsDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={briefRef}>
        <AnimatePresence>
          {stage === "brief" && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <InvestigatorBrief onReplay={runDemo} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="relative z-10 border-t border-[color:var(--accent-signal)]/15 px-6 py-6 text-center text-[11px] uppercase tracking-[0.22em] text-foreground/40">
        Shadowless · Demo build · Simulated data — for presentation only
      </footer>
    </div>
  );
}

/* ─────────────────────────────── Background FX ────────────────────────────── */

function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,197,94,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.10) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
        }}
      />
      {/* scanning line */}
      <motion.div
        className="absolute inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.55), transparent)" }}
        initial={{ top: "-2%" }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 7, ease: "linear", repeat: Infinity }}
      />
      {/* glow blobs */}
      <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[color:var(--accent-signal)]/10 blur-[140px]" />
      <div className="absolute bottom-[-200px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[color:var(--accent-signal)]/8 blur-[160px]" />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,#000_100%)]" />
    </div>
  );
}

/* ─────────────────────────────── Demo Nav ─────────────────────────────────── */

function DemoNav({ stage, progress, onRun }: { stage: Stage; progress: number; onRun: () => void }) {
  const live = stage !== "idle";
  return (
    <div className="sticky top-0 z-30 border-b border-[color:var(--accent-signal)]/20 bg-[#06090a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3 sm:gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded border border-[color:var(--accent-signal)]/40 bg-[color:var(--accent-signal)]/10 shadow-[0_0_18px_rgba(34,197,94,0.35)]">
          <ShieldAlert size={16} className="text-[color:var(--accent-signal)]" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-none tracking-wide text-foreground">SHADOWLESS</div>
          <div className="mono mt-1 text-[10.5px] uppercase tracking-[0.22em] text-foreground/50">
            Cyber Intelligence Workspace
          </div>
        </div>

        <div className="mx-auto hidden items-center gap-2 rounded-full border border-[color:var(--accent-signal)]/25 bg-black/30 px-3 py-1 md:flex">
          <span className={cn(
            "h-2 w-2 rounded-full",
            live ? "bg-[color:var(--accent-signal)] shadow-[0_0_10px_var(--accent-signal)] animate-pulse" : "bg-foreground/40",
          )} />
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-foreground/70">
            {live ? `Operating · ${progress}%` : "Standby"}
          </span>
        </div>

        <button
          onClick={onRun}
          className="ml-auto inline-flex h-9 items-center gap-2 rounded border border-[color:var(--accent-signal)]/60 bg-[color:var(--accent-signal)]/15 px-3 text-[12.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent-signal)] transition hover:bg-[color:var(--accent-signal)]/25"
        >
          <Play size={13} /> {stage === "idle" ? "Start" : "Replay"}
        </button>
      </div>
      {/* progress rail */}
      <div className="h-[2px] w-full bg-black/40">
        <motion.div
          className="h-full bg-[color:var(--accent-signal)]"
          style={{ boxShadow: "0 0 14px var(--accent-signal)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────── Command Center ───────────────────────────── */

function CommandCenter({
  stage, progress, phase, onRun, running,
}: { stage: Stage; progress: number; phase: string; onRun: () => void; running: boolean }) {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 pt-14 pb-12 sm:pt-20 sm:pb-16">
      <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="mono inline-flex items-center gap-2 rounded border border-[color:var(--accent-signal)]/30 bg-[color:var(--accent-signal)]/10 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--accent-signal)]">
            <Radar size={11} /> Case #KZ-2048 · Live Demo
          </div>
          <h1 className="mt-4 text-[42px] font-black leading-[0.95] tracking-tight text-foreground sm:text-[58px] lg:text-[72px]">
            <span className="block">AI intelligence</span>
            <span className="block bg-gradient-to-r from-[color:var(--accent-signal)] via-[color:var(--accent-signal)] to-emerald-200 bg-clip-text text-transparent">
              workspace for investigators.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-foreground/65 sm:text-[16.5px]">
            Scattered signals → structured intelligence → investigator-ready briefs. In seconds.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onRun}
              className={cn(
                "group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded border border-[color:var(--accent-signal)]/70 bg-[color:var(--accent-signal)] px-5 text-[13.5px] font-bold uppercase tracking-[0.18em] text-black transition",
                "shadow-[0_0_0_1px_rgba(34,197,94,0.3),0_8px_40px_-6px_rgba(34,197,94,0.55)] hover:shadow-[0_0_0_1px_rgba(34,197,94,0.5),0_10px_50px_-4px_rgba(34,197,94,0.7)]",
              )}
            >
              <Zap size={14} />
              {running ? "Re-run Intelligence Scan" : "Run Intelligence Scan"}
              <ArrowRight size={14} className="transition group-hover:translate-x-1" />
              <span aria-hidden className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 opacity-0 transition group-hover:opacity-60 group-hover:translate-x-[400%]" />
            </button>
            <div className="mono flex items-center gap-2 rounded border border-foreground/15 bg-black/40 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-foreground/60">
              <ScanLine size={12} className="text-[color:var(--accent-signal)]" />
              {running ? `${phase} · ${progress}%` : "Awaiting operator command"}
            </div>
          </div>
        </div>

        <RadarVisual running={running} progress={progress} />
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard icon={Database} label="Sources monitored"   target={DEMO_METRICS.sourcesMonitored} stage={stage} suffix="" />
        <MetricCard icon={Signal}   label="Signals processed"   target={DEMO_METRICS.signalsProcessed} stage={stage} suffix="" />
        <MetricCard icon={Users}    label="Entities extracted"  target={DEMO_METRICS.entitiesExtracted} stage={stage} suffix="" />
        <MetricCard icon={Target}   label="High-risk clusters"  target={DEMO_METRICS.highRiskClusters} stage={stage} suffix="" accent />
        <MetricCard icon={Gauge}    label="Analyst hours saved" target={DEMO_METRICS.analystHoursSaved} stage={stage} suffix="h" />
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon, label, target, stage, suffix, accent,
}: { icon: any; label: string; target: number; stage: Stage; suffix?: string; accent?: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (stage === "idle") { setVal(0); return; }
    const start = performance.now();
    const DUR = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, target]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded border bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-4 backdrop-blur-md",
        accent ? "border-[color:var(--accent-signal)]/45 shadow-[0_0_30px_-12px_rgba(34,197,94,0.55)]" : "border-foreground/10",
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded border",
          accent ? "border-[color:var(--accent-signal)]/40 bg-[color:var(--accent-signal)]/15 text-[color:var(--accent-signal)]"
                 : "border-foreground/15 bg-foreground/[0.04] text-foreground/70",
        )}>
          <Icon size={13} />
        </div>
        <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">{label}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={cn("mono text-[30px] font-bold leading-none tabular-nums", accent ? "text-[color:var(--accent-signal)]" : "text-foreground")}>
          {val.toLocaleString()}
        </span>
        {suffix && <span className="mono text-[12px] text-foreground/50">{suffix}</span>}
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[color:var(--accent-signal)]/60 to-transparent opacity-0 transition group-hover:opacity-100" />
    </motion.div>
  );
}

function RadarVisual({ running, progress }: { running: boolean; progress: number }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <div className="absolute inset-0 rounded-full border border-[color:var(--accent-signal)]/30" />
      <div className="absolute inset-[8%] rounded-full border border-[color:var(--accent-signal)]/22" />
      <div className="absolute inset-[20%] rounded-full border border-[color:var(--accent-signal)]/18" />
      <div className="absolute inset-[34%] rounded-full border border-[color:var(--accent-signal)]/14" />
      <div className="absolute inset-[48%] rounded-full border border-[color:var(--accent-signal)]/10" />
      {/* crosshair */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[color:var(--accent-signal)]/15" />
      <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-[color:var(--accent-signal)]/15" />
      {/* sweep */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-top-left"
        style={{
          background: "conic-gradient(from 0deg, rgba(34,197,94,0.45), transparent 35%)",
          borderTopLeftRadius: "100%",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: running ? 3.2 : 6, ease: "linear", repeat: Infinity }}
      />
      {/* center node */}
      <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[color:var(--accent-signal)]/25 blur-xl" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--accent-signal)]/60 bg-black/70 backdrop-blur">
          <Brain size={20} className="text-[color:var(--accent-signal)]" />
        </div>
      </div>
      {/* pings */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--accent-signal)]/60"
          initial={{ scale: 0.4, opacity: 0.8 }}
          animate={{ scale: 6, opacity: 0 }}
          transition={{ duration: 2.6, ease: "easeOut", repeat: Infinity, delay: i * 0.85 }}
        />
      ))}
      <div className="mono absolute -bottom-2 left-1/2 -translate-x-1/2 rounded border border-[color:var(--accent-signal)]/30 bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent-signal)]">
        Sentinel Agent · {running ? `${progress}%` : "idle"}
      </div>
    </div>
  );
}

/* ────────────────────── Source Scanning Animation ─────────────────────────── */

function SourceScanningAnimation({
  active, scanning, activeSources, phase,
}: { active: boolean; scanning: boolean; activeSources: Set<string>; phase: string }) {
  const N = DEMO_SOURCES.length;
  // ring positions for sources
  const positions = useMemo(() => {
    return DEMO_SOURCES.map((_, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = 38; // percent radius
      const x = 50 + Math.cos(angle) * r;
      const y = 50 + Math.sin(angle) * r;
      return { x, y };
    });
  }, [N]);

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:py-16">
      <SectionHeader
        eyebrow="Stage 01 · Acquisition"
        title="Live source ingestion"
        sub="The central agent listens to fictional approved sources. Each card lights up as it begins streaming demo signals into the pipeline."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-lg border border-foreground/10 bg-black/40 backdrop-blur">
          {/* grid bg */}
          <div className="pointer-events-none absolute inset-0 opacity-30"
               style={{ backgroundImage: "radial-gradient(rgba(34,197,94,0.18) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          {/* SVG lines */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="line-grad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(34,197,94,0.05)" />
                <stop offset="50%" stopColor="rgba(34,197,94,0.65)" />
                <stop offset="100%" stopColor="rgba(34,197,94,0.05)" />
              </linearGradient>
            </defs>
            {positions.map((p, i) => {
              const lit = activeSources.has(DEMO_SOURCES[i].id);
              return (
                <line
                  key={i}
                  x1={p.x} y1={p.y} x2={50} y2={50}
                  stroke={lit ? "url(#line-grad)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={lit ? 0.35 : 0.18}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/* particles flowing inward */}
          {scanning && positions.map((p, i) => (
            activeSources.has(DEMO_SOURCES[i].id) && (
              <motion.span
                key={`pt-${i}`}
                className="absolute h-1.5 w-1.5 rounded-full bg-[color:var(--accent-signal)] shadow-[0_0_8px_var(--accent-signal)]"
                initial={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 0 }}
                animate={{ left: `${50}%`, top: `${50}%`, opacity: [0, 1, 0] }}
                transition={{ duration: 1.6, ease: "easeIn", repeat: Infinity, delay: (i % 3) * 0.4 }}
              />
            )
          ))}

          {/* center agent */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 -m-6 rounded-full bg-[color:var(--accent-signal)]/30 blur-2xl" />
              <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full border border-[color:var(--accent-signal)]/60 bg-black/80 backdrop-blur">
                <Brain size={20} className="text-[color:var(--accent-signal)]" />
                <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.18em] text-[color:var(--accent-signal)]">Agent</div>
              </div>
            </div>
            <div className="mono mt-2 whitespace-nowrap rounded border border-[color:var(--accent-signal)]/40 bg-black/80 px-2 py-1 text-center text-[10px] uppercase tracking-[0.18em] text-[color:var(--accent-signal)]">
              {active ? phase : "Standby"}
            </div>
          </div>

          {/* source nodes */}
          {positions.map((p, i) => {
            const s = DEMO_SOURCES[i];
            const lit = activeSources.has(s.id);
            return (
              <motion.div
                key={s.id}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                initial={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: lit ? 1 : 0.92, opacity: lit ? 1 : 0.5 }}
                transition={{ duration: 0.4 }}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded border bg-black/70 backdrop-blur",
                  lit ? "border-[color:var(--accent-signal)]/70 shadow-[0_0_20px_rgba(34,197,94,0.55)]"
                      : "border-foreground/15",
                )}>
                  <SourceIcon kind={s.kind} lit={lit} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Source list */}
        <div className="flex flex-col gap-2">
          {DEMO_SOURCES.map((s, i) => {
            const lit = activeSources.has(s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={cn(
                  "group flex items-center gap-3 rounded border px-3 py-2.5 backdrop-blur transition",
                  lit ? "border-[color:var(--accent-signal)]/45 bg-[color:var(--accent-signal)]/8"
                      : "border-foreground/10 bg-black/30",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded border",
                  lit ? "border-[color:var(--accent-signal)]/60 text-[color:var(--accent-signal)]"
                      : "border-foreground/15 text-foreground/60",
                )}>
                  <SourceIcon kind={s.kind} lit={lit} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-foreground">{s.name}</span>
                    {s.badge === "Simulated" && (
                      <span className="mono shrink-0 rounded border border-[color:var(--risk-medium)]/40 bg-[color:var(--risk-medium)]/10 px-1.5 py-px text-[9.5px] uppercase tracking-wider text-[color:var(--risk-medium)]">
                        sim
                      </span>
                    )}
                  </div>
                  <div className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.16em] text-foreground/50">
                    {s.kind} · reliability {s.reliability}%
                  </div>
                </div>
                <span className={cn(
                  "mono shrink-0 text-[10.5px] uppercase tracking-[0.18em]",
                  lit ? "text-[color:var(--accent-signal)]" : "text-foreground/40",
                )}>
                  {lit ? "● streaming" : "○ standby"}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SourceIcon({ kind, lit }: { kind: string; lit: boolean }) {
  const cls = lit ? "text-[color:var(--accent-signal)]" : "text-foreground/60";
  switch (kind) {
    case "Messaging":    return <Radio size={14} className={cls} />;
    case "Web":          return <Waves size={14} className={cls} />;
    case "OSINT":        return <Radar size={14} className={cls} />;
    case "Forum":        return <Layers size={14} className={cls} />;
    case "News":         return <FileText size={14} className={cls} />;
    case "Internal":     return <Database size={14} className={cls} />;
    case "Threat-Intel": return <ShieldAlert size={14} className={cls} />;
    default:             return <Signal size={14} className={cls} />;
  }
}

/* ────────────────────────── Intelligence Pipeline ─────────────────────────── */

function IntelligencePipeline({ activeIdx }: { activeIdx: number }) {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:py-16">
      <SectionHeader
        eyebrow="Stage 02 · Reasoning"
        title="Intelligence pipeline"
        sub="Each stage activates in order, transforming raw signals into a defensible analyst brief."
      />

      <ol className="mt-8 grid gap-2 md:grid-cols-7">
        {PIPELINE_STEPS.map((s, i) => {
          const done = activeIdx > i;
          const active = activeIdx === i;
          const idle = activeIdx < i;
          return (
            <li key={s.key} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={cn(
                  "flex h-full flex-col gap-2 rounded border p-3 backdrop-blur transition",
                  active && "border-[color:var(--accent-signal)]/70 bg-[color:var(--accent-signal)]/10 shadow-[0_0_28px_-8px_rgba(34,197,94,0.7)]",
                  done && "border-[color:var(--accent-signal)]/35 bg-[color:var(--accent-signal)]/[0.04]",
                  idle && "border-foreground/10 bg-black/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "mono text-[10px] uppercase tracking-[0.2em]",
                    active || done ? "text-[color:var(--accent-signal)]" : "text-foreground/45",
                  )}>
                    0{i + 1}
                  </span>
                  {done && <CheckCircle2 size={13} className="text-[color:var(--accent-signal)]" />}
                  {active && (
                    <motion.span
                      className="h-2 w-2 rounded-full bg-[color:var(--accent-signal)]"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    />
                  )}
                </div>
                <div className={cn(
                  "text-[14px] font-bold",
                  active || done ? "text-foreground" : "text-foreground/70",
                )}>
                  {s.label}
                </div>
                <div className="text-[11.5px] leading-snug text-foreground/55">{s.note}</div>
                {active && (
                  <motion.div className="mt-1 h-0.5 w-full overflow-hidden rounded bg-foreground/10">
                    <motion.div
                      className="h-full bg-[color:var(--accent-signal)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </motion.div>
                )}
              </motion.div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ChevronRight size={12} className="absolute -right-1.5 top-1/2 hidden -translate-y-1/2 text-foreground/30 md:block" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ────────────────────────── Analytics Dashboard ───────────────────────────── */

function AnalyticsDashboard() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:py-14">
      <SectionHeader
        eyebrow="Stage 03 · Visualization"
        title="Analytics dashboard"
        sub="Realistic synthesized data — generated by the pipeline above. Hover any chart for detail."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        {/* Risk score */}
        <Panel className="lg:col-span-3" title="Aggregate risk" icon={ShieldAlert}>
          <div className="flex items-baseline gap-2">
            <span className="mono text-[44px] font-bold leading-none text-[color:var(--risk-critical)]">87</span>
            <span className="mono text-[12px] text-foreground/50">/ 100</span>
          </div>
          <div className="mono mt-1 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--risk-critical)]">Critical</div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-foreground/10">
            <motion.div
              className="h-full bg-gradient-to-r from-[color:var(--risk-medium)] via-[color:var(--risk-high)] to-[color:var(--risk-critical)]"
              initial={{ width: 0 }} animate={{ width: "87%" }} transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Stat label="Confidence" value={DEMO_METRICS.confidence} />
            <Stat label="Reliability" value={`${DEMO_METRICS.reliability}%`} />
            <Stat label="Review" value={String(DEMO_METRICS.manualReview)} />
          </div>
        </Panel>

        {/* Confidence trend */}
        <Panel className="lg:col-span-5" title="Source confidence" icon={Activity}>
          <div className="-ml-2 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CONFIDENCE_SERIES} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="confGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-signal)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--accent-signal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <Tooltip contentStyle={{ background: "#06090a", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 4, fontSize: 12 }} />
                <Area type="monotone" dataKey="confidence" stroke="var(--accent-signal)" strokeWidth={2} fill="url(#confGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Source distribution */}
        <Panel className="lg:col-span-4" title="Source distribution" icon={Filter}>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SOURCE_DISTRIBUTION} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="#06090a">
                  {SOURCE_DISTRIBUTION.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Risk timeline */}
        <Panel className="lg:col-span-7" title="Risk activity timeline" icon={Activity}>
          <div className="-ml-2 h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RISK_TIMELINE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <Tooltip contentStyle={{ background: "#06090a", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 4, fontSize: 12 }} />
                <Bar dataKey="low"  stackId="a" fill="var(--risk-low)" />
                <Bar dataKey="med"  stackId="a" fill="var(--risk-medium)" />
                <Bar dataKey="high" stackId="a" fill="var(--risk-high)" />
                <Bar dataKey="crit" stackId="a" fill="var(--risk-critical)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Entity graph */}
        <Panel className="lg:col-span-5" title="Entity relationships" icon={Network}>
          <EntityGraph />
        </Panel>

        {/* Keyword clusters */}
        <Panel className="lg:col-span-5" title="Keyword clusters" icon={Sparkles}>
          <div className="flex flex-wrap gap-1.5">
            {KEYWORD_CLUSTERS.map((k) => {
              const size = 11 + (k.weight / 100) * 12;
              const alpha = 0.35 + (k.weight / 100) * 0.65;
              return (
                <span
                  key={k.word}
                  className="mono rounded border px-2 py-1"
                  style={{
                    fontSize: size,
                    borderColor: `rgba(34,197,94,${alpha})`,
                    color: `rgba(220,255,235,${0.55 + alpha * 0.4})`,
                    background: `rgba(34,197,94,${alpha * 0.08})`,
                  }}
                >
                  {k.word}
                </span>
              );
            })}
          </div>
        </Panel>

        {/* Alerts severity table */}
        <Panel className="lg:col-span-7" title="Alert severity" icon={Bell}>
          <div className="overflow-hidden rounded border border-foreground/10">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-foreground/55">
                  <th className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em]">ID</th>
                  <th className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em]">Severity</th>
                  <th className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em]">Finding</th>
                  <th className="mono hidden px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] md:table-cell">Source</th>
                  <th className="mono px-2.5 py-1.5 text-right text-[10px] uppercase tracking-[0.16em]">Age</th>
                </tr>
              </thead>
              <tbody>
                {ALERTS.map((a) => (
                  <tr key={a.id} className="border-t border-foreground/10">
                    <td className="mono px-2.5 py-1.5 text-[11px] text-foreground/70">{a.id}</td>
                    <td className="px-2.5 py-1.5"><SeverityChip severity={a.severity as any} /></td>
                    <td className="px-2.5 py-1.5 text-[12.5px] text-foreground/85">{a.title}</td>
                    <td className="mono hidden px-2.5 py-1.5 text-[11px] text-foreground/55 md:table-cell">{a.source}</td>
                    <td className="mono px-2.5 py-1.5 text-right text-[11px] text-foreground/55">{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Recent signals feed */}
        <Panel className="lg:col-span-5" title="Recent signals" icon={Signal}>
          <ul className="space-y-1.5">
            {SIGNALS_FEED.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="grid grid-cols-[auto_1fr] gap-2 border-b border-foreground/5 pb-1.5 last:border-0"
              >
                <span className="mono pt-0.5 text-[10.5px] uppercase tracking-[0.16em] text-[color:var(--accent-signal)]">{s.time}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] text-foreground/85">{s.text}</div>
                  <div className="mono text-[10.5px] text-foreground/45">{s.source}</div>
                </div>
              </motion.li>
            ))}
          </ul>
        </Panel>

        {/* Generated summary */}
        <Panel className="lg:col-span-7" title="Generated analyst summary" icon={Brain} accent>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[color:var(--accent-signal)]/45 bg-[color:var(--accent-signal)]/10">
              <Sparkles size={14} className="text-[color:var(--accent-signal)]" />
            </div>
            <div>
              <p className="text-[13.5px] leading-relaxed text-foreground/85">{GENERATED_SUMMARY}</p>
              <div className="mono mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] uppercase tracking-[0.16em] text-foreground/50">
                <span>model · sentinel-graph-v2.4</span>
                <span>tokens · 1,284</span>
                <span>latency · 1.6s</span>
                <span>confidence · {DEMO_METRICS.confidence}</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Panel({
  children, className, title, icon: Icon, accent,
}: { children: React.ReactNode; className?: string; title: string; icon: any; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-lg border bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-4 backdrop-blur-md",
        accent ? "border-[color:var(--accent-signal)]/40 shadow-[0_0_40px_-12px_rgba(34,197,94,0.55)]" : "border-foreground/10",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon size={13} className={accent ? "text-[color:var(--accent-signal)]" : "text-foreground/55"} />
        <span className="mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/65">{title}</span>
        <span className="mono ml-auto rounded border border-foreground/10 px-1.5 py-px text-[9.5px] uppercase tracking-[0.18em] text-foreground/40">
          demo
        </span>
      </div>
      {children}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-foreground/10 bg-black/30 px-2 py-1.5">
      <div className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/50">{label}</div>
      <div className="mt-0.5 text-[12px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SeverityChip({ severity }: { severity: "critical" | "high" | "medium" | "low" }) {
  const map = {
    critical: ["text-[color:var(--risk-critical)]", "border-[color:var(--risk-critical)]/40", "bg-[color:var(--risk-critical)]/10"],
    high:     ["text-[color:var(--risk-high)]",     "border-[color:var(--risk-high)]/40",     "bg-[color:var(--risk-high)]/10"],
    medium:   ["text-[color:var(--risk-medium)]",   "border-[color:var(--risk-medium)]/40",   "bg-[color:var(--risk-medium)]/10"],
    low:      ["text-[color:var(--risk-low)]",      "border-[color:var(--risk-low)]/40",      "bg-[color:var(--risk-low)]/10"],
  }[severity];
  return (
    <span className={cn("mono inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", ...map)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {severity}
    </span>
  );
}

/* Inline entity graph (SVG, no external lib) */
function EntityGraph() {
  // simple radial layout
  const center = { x: 50, y: 50 };
  const nodes = ENTITIES.map((e, i) => {
    const angle = (i / ENTITIES.length) * Math.PI * 2 - Math.PI / 2;
    const r = e.risk === "critical" ? 0 : 32;
    return { ...e, x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r };
  });
  const center0 = nodes.find((n) => n.risk === "critical") ?? nodes[0];
  const colorFor = (risk: string) =>
    risk === "critical" ? "var(--risk-critical)"
    : risk === "high" ? "var(--risk-high)"
    : risk === "medium" ? "var(--risk-medium)"
    : "var(--risk-low)";

  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded border border-foreground/10 bg-black/30">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {nodes.map((n, i) => n.id !== center0.id && (
          <line key={`l-${i}`} x1={center0.x} y1={center0.y} x2={n.x} y2={n.y} stroke="rgba(34,197,94,0.35)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {nodes.map((n, i) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.id === center0.id ? 3.4 : 2.2} fill={colorFor(n.risk)} opacity={0.95} />
            <circle cx={n.x} cy={n.y} r={n.id === center0.id ? 5.2 : 3.4} fill="none" stroke={colorFor(n.risk)} strokeOpacity={0.35} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0">
        {nodes.map((n) => (
          <div
            key={`lbl-${n.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y + (n.id === center0.id ? 8 : 6)}%` }}
          >
            <div className="mono whitespace-nowrap rounded border border-foreground/15 bg-black/70 px-1.5 py-0.5 text-[9.5px] text-foreground/80">
              {n.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────── Investigator Brief ────────────────────────────── */

function InvestigatorBrief({ onReplay }: { onReplay: () => void }) {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <SectionHeader
        eyebrow="Stage 04 · Output"
        title="Investigator brief"
        sub="Auto-generated, fully attributable, ready for analyst review or legal handoff."
      />

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 overflow-hidden rounded-lg border border-[color:var(--accent-signal)]/30 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md shadow-[0_0_60px_-20px_rgba(34,197,94,0.55)]"
      >
        {/* Brief header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-foreground/10 bg-black/30 p-5">
          <div>
            <div className="mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--accent-signal)]">
              Case Brief · KZ-2048 · Confidential (Simulated)
            </div>
            <h3 className="mt-1 text-[22px] font-bold leading-tight text-foreground sm:text-[26px]">
              Coordinated cross-source signal cluster — recommended manual review
            </h3>
            <div className="mono mt-1 text-[11px] uppercase tracking-[0.16em] text-foreground/55">
              Generated · just now · Sentinel Agent v2.4 · Confidence {DEMO_METRICS.confidence}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <BriefBtn icon={Download} label="PDF" primary />
            <BriefBtn icon={FileText} label="Case File" />
            <BriefBtn icon={Share2}   label="Share with Analyst" />
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[2fr_1fr]">
          {/* Left: narrative + findings */}
          <div className="space-y-5 p-5">
            <BriefBlock title="Executive summary">
              <p className="text-[14px] leading-relaxed text-foreground/85">{GENERATED_SUMMARY}</p>
            </BriefBlock>

            <BriefBlock title="Key findings">
              <ul className="space-y-2">
                {KEY_FINDINGS.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px] text-foreground/85">
                    <span className="mono mt-0.5 shrink-0 rounded border border-[color:var(--accent-signal)]/40 bg-[color:var(--accent-signal)]/10 px-1.5 text-[10px] uppercase tracking-wider text-[color:var(--accent-signal)]">
                      KF-{(i + 1).toString().padStart(2, "0")}
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </BriefBlock>

            <BriefBlock title="Evidence">
              <div className="overflow-hidden rounded border border-foreground/10">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-white/[0.02] text-foreground/55">
                    <tr>
                      <th className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em]">Entity</th>
                      <th className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em]">Role</th>
                      <th className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em]">Risk</th>
                      <th className="mono px-2.5 py-1.5 text-right text-[10px] uppercase tracking-[0.16em]">Edges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENTITIES.map((e) => (
                      <tr key={e.id} className="border-t border-foreground/10">
                        <td className="px-2.5 py-1.5 font-semibold text-foreground">{e.label}</td>
                        <td className="px-2.5 py-1.5 text-foreground/70">{e.role}</td>
                        <td className="px-2.5 py-1.5"><SeverityChip severity={e.risk as any} /></td>
                        <td className="mono px-2.5 py-1.5 text-right tabular-nums text-foreground/75">{e.connections}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BriefBlock>

            <BriefBlock title="Recommended next actions">
              <ol className="space-y-2">
                {NEXT_ACTIONS.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px] text-foreground/85">
                    <span className="mono mt-0.5 shrink-0 rounded bg-[color:var(--accent-signal)]/15 px-1.5 text-[11px] font-bold text-[color:var(--accent-signal)]">{i + 1}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </BriefBlock>
          </div>

          {/* Right: side panel */}
          <aside className="space-y-4 border-l border-foreground/10 bg-black/30 p-5">
            <SidePanel title="Source confidence">
              <ul className="space-y-2">
                {DEMO_SOURCES.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <div className="flex items-baseline justify-between">
                      <span className="truncate text-[12px] text-foreground/80">{s.name}</span>
                      <span className="mono text-[11px] text-[color:var(--accent-signal)]">{s.reliability}%</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded bg-foreground/10">
                      <div className="h-full bg-[color:var(--accent-signal)]" style={{ width: `${s.reliability}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </SidePanel>

            <SidePanel title="Timeline">
              <ol className="relative ml-2 border-l border-[color:var(--accent-signal)]/30 pl-3">
                {SIGNALS_FEED.slice(0, 5).map((s, i) => (
                  <li key={i} className="relative mb-2.5">
                    <span className="absolute -left-[7px] top-1 h-2 w-2 rounded-full bg-[color:var(--accent-signal)] shadow-[0_0_8px_var(--accent-signal)]" />
                    <div className="mono text-[10px] uppercase tracking-[0.16em] text-foreground/45">{s.time}</div>
                    <div className="text-[12px] text-foreground/80">{s.text}</div>
                  </li>
                ))}
              </ol>
            </SidePanel>

            <SidePanel title="Compliance">
              <p className="text-[11.5px] leading-relaxed text-foreground/55">
                All sources in this brief are simulated for demonstration. Production deployments operate only on
                pre-approved, lawfully accessible feeds with full audit trail.
              </p>
            </SidePanel>
          </aside>
        </div>
      </motion.article>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onReplay}
          className="inline-flex h-11 items-center gap-2 rounded border border-[color:var(--accent-signal)]/60 bg-[color:var(--accent-signal)] px-4 text-[12.5px] font-bold uppercase tracking-[0.16em] text-black shadow-[0_8px_30px_-6px_rgba(34,197,94,0.55)] hover:shadow-[0_10px_40px_-4px_rgba(34,197,94,0.7)]"
        >
          <Play size={13} /> Replay demo
        </button>
        <a
          href="/workspace"
          className="mono inline-flex h-11 items-center gap-2 rounded border border-foreground/15 bg-black/40 px-4 text-[11.5px] uppercase tracking-[0.16em] text-foreground/70 hover:border-[color:var(--accent-signal)]/40 hover:text-[color:var(--accent-signal)]"
        >
          Open full workspace <ArrowRight size={12} />
        </a>
      </div>
    </section>
  );
}

function BriefBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mono mb-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-[color:var(--accent-signal)]">{title}</h4>
      {children}
    </section>
  );
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h5 className="mono mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55">{title}</h5>
      {children}
    </section>
  );
}

function BriefBtn({ icon: Icon, label, primary }: { icon: any; label: string; primary?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded px-3 text-[12px] font-bold uppercase tracking-[0.14em] transition",
        primary
          ? "border border-[color:var(--accent-signal)]/60 bg-[color:var(--accent-signal)] text-black shadow-[0_6px_24px_-8px_rgba(34,197,94,0.65)] hover:shadow-[0_8px_30px_-6px_rgba(34,197,94,0.8)]"
          : "border border-foreground/15 bg-black/40 text-foreground/80 hover:border-[color:var(--accent-signal)]/45 hover:text-[color:var(--accent-signal)]",
      )}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

/* ─────────────────────────────── Helpers ──────────────────────────────────── */

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="max-w-3xl">
      <div className="mono inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--accent-signal)]">
        <span className="inline-block h-px w-6 bg-[color:var(--accent-signal)]" />
        {eyebrow}
      </div>
      <h2 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[34px]">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-foreground/60 sm:text-[15px]">{sub}</p>
    </div>
  );
}