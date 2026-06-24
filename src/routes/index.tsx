import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, Bell, Brain, CheckCircle2, ChevronRight, Database,
  Download, ExternalLink, FileText, Filter, Gauge, Layers, Network, Play, Radar, Radio, Terminal,
  ScanLine, Share2, ShieldAlert, Signal, Sparkles, Target, Users, Waves, Zap,
} from "lucide-react";
import { toast } from "sonner";
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
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

/* ─────────────────────── Live operations engine ────────────────────────── */

type LogLevel = "info" | "ok" | "warn" | "crit";
type LogKind =
  | "fetch" | "parse" | "dedup" | "lang" | "ner" | "embed" | "match"
  | "link" | "risk" | "alert" | "geo" | "wallet" | "translate" | "score" | "sys";

interface LogEntry {
  id: number;
  t: string;            // hh:mm:ss.mmm
  kind: LogKind;
  level: LogLevel;
  source: string;       // short code
  msg: string;
}

interface OpCounters {
  msgs: number;
  kb: number;
  dedupes: number;
  entities: number;
  edges: number;
  alerts: number;
  risk: number;        // 0..100
}

const SRC_CODES = [
  { code: "tg.alpha",   kind: "Messaging" as const },
  { code: "web.mon",    kind: "Web" as const },
  { code: "osint.03",   kind: "OSINT" as const },
  { code: "forum.wl",   kind: "Forum" as const },
  { code: "news.kz",    kind: "News" as const },
  { code: "case.int",   kind: "Internal" as const },
  { code: "ti.rstr",    kind: "Threat-Intel" as const },
];

// Map demo source id ↔ live ops code (single source of truth for sync)
const CODE_FOR_ID: Record<string, string> = {
  tg: "tg.alpha", web: "web.mon", osint: "osint.03", forum: "forum.wl",
  news: "news.kz", case: "case.int", ti: "ti.rstr",
};
const ID_FOR_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_FOR_ID).map(([id, code]) => [code, id]),
);

const ENTITY_POOL = [
  "Subject_Alpha", "Subject_Bravo", "Subject_Charlie",
  "wallet:0x7af3…b21", "wallet:0x91c…ee4", "handle:@kz-obs",
  "domain:n-mirror.example", "domain:rl-mirror2.example",
  "phone:+7-705-***-41-08", "loc:Almaty/E", "loc:Astana/W",
];

const TOKEN_POOL = ["coordinated", "rendezvous", "handoff", "mirror", "transfer", "burner", "обмен", "встреча", "перевод"];

const HASH = () => Math.random().toString(16).slice(2, 10);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const between = (a: number, b: number) => a + Math.random() * (b - a);

function ts(elapsedMs: number) {
  // pretend the case started today at 14:23:00
  const base = new Date();
  base.setHours(14, 23, 0, 0);
  const d = new Date(base.getTime() + elapsedMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

/** Build one realistic log entry biased by current scan phase / pipeline step. */
function emitEvent(stage: Stage, phaseIdx: number, pipelineIdx: number, onlineCodes: string[]): Omit<LogEntry, "id" | "t"> {
  const pool = onlineCodes.length
    ? SRC_CODES.filter((s) => onlineCodes.includes(s.code))
    : SRC_CODES;
  const src = pick(pool.length ? pool : SRC_CODES);

  if (stage === "scanning") {
    // weight events to the current phase
    const phase = SCAN_PHASES[phaseIdx];
    if (phase === "Connecting" || phase === "Collecting") {
      const r = Math.random();
      if (r < 0.55) {
        const bytes = Math.round(between(0.4, 6.2) * 1024);
        const ms = Math.round(between(38, 412));
        const cnt = Math.round(between(4, 38));
        return { kind: "fetch", level: "info", source: src.code,
          msg: `GET ${src.code}/feed?after=${HASH()} → 200 OK · ${(bytes/1024).toFixed(1)} KB · ${cnt} items · ${ms}ms` };
      }
      if (r < 0.7) return { kind: "sys", level: "info", source: src.code,
        msg: `tls handshake · cipher TLS_AES_128_GCM_SHA256 · sni=${src.code}` };
      return { kind: "dedup", level: "info", source: src.code,
        msg: `dedup sha1=${HASH()} · ${Math.random() < 0.35 ? "DROP duplicate" : "KEEP new"}` };
    }
    if (phase === "Parsing") {
      if (Math.random() < 0.5) return { kind: "parse", level: "info", source: src.code,
        msg: `parse msg#${Math.floor(between(1000,9999))} · 1 attachment · 0 urls · ${Math.round(between(8,180))} tokens` };
      return { kind: "lang", level: "info", source: src.code,
        msg: `lang-detect ${pick(["ru","kk","en","ru/Cyrl"])} conf ${(between(0.78,0.99)).toFixed(2)}` };
    }
    if (phase === "Extracting entities") {
      if (Math.random() < 0.65) {
        const ent = pick(ENTITY_POOL);
        return { kind: "ner", level: "info", source: src.code,
          msg: `NER ${pick(["PERSON","ORG","LOC","WALLET","PHONE","HANDLE","DOMAIN"])} → ${ent} · conf ${(between(0.71,0.97)).toFixed(2)}` };
      }
      return { kind: "embed", level: "info", source: src.code,
        msg: `embed 768-d signal#${Math.floor(between(100,899))} · model snt-emb-v2.4 · ${Math.round(between(18,62))}ms` };
    }
    if (phase === "Matching patterns") {
      if (Math.random() < 0.5) return { kind: "match", level: "info", source: src.code,
        msg: `pattern '${pick(TOKEN_POOL)}' × '${pick(TOKEN_POOL)}' within 90s → match (Δ=${Math.round(between(8,72))}s)` };
      return { kind: "link", level: "ok", source: src.code,
        msg: `link ${pick(ENTITY_POOL)} → ${pick(ENTITY_POOL)} · edge_w ${(between(0.41,0.92)).toFixed(2)}` };
    }
    if (phase === "Risk scoring") {
      if (Math.random() < 0.55) return { kind: "risk", level: "warn", source: src.code,
        msg: `cluster#${Math.floor(between(1,9))} risk Δ +${between(0.02,0.08).toFixed(2)} → ${between(0.62,0.91).toFixed(2)}` };
      return { kind: "alert", level: "crit", source: src.code,
        msg: `ALERT AL-${Math.floor(between(2040,2060))} ${pick(["coordinated burst","cross-source overlap","after-hours spike"])}` };
    }
    // generic
    return { kind: "sys", level: "info", source: src.code, msg: `heartbeat ok · queue=${Math.floor(between(2,48))}` };
  }

  if (stage === "pipeline") {
    const step = PIPELINE_STEPS[Math.max(0, pipelineIdx)];
    const m: Record<string, () => Omit<LogEntry,"id"|"t">> = {
      collect: () => ({ kind: "fetch", level: "info", source: src.code,
        msg: `collect window 72h · ${Math.floor(between(80,160))} new · ${Math.floor(between(0,18))} retried` }),
      clean:   () => ({ kind: "dedup", level: "info", source: src.code,
        msg: `dedup pass · sha1+minhash · collapsed ${Math.floor(between(2,9))} · noise drop ${Math.floor(between(1,6))}` }),
      extract: () => ({ kind: "ner", level: "info", source: src.code,
        msg: `extract entities · +${Math.floor(between(2,8))} (${pick(["PERSON","WALLET","DOMAIN","LOC","HANDLE"])})` }),
      match:   () => ({ kind: "link", level: "ok", source: src.code,
        msg: `cross-source match · edge ${pick(ENTITY_POOL)}↔${pick(ENTITY_POOL)} · w ${(between(0.51,0.94)).toFixed(2)}` }),
      score:   () => ({ kind: "risk", level: "warn", source: src.code,
        msg: `score cluster#${Math.floor(between(1,9))} → ${between(0.62,0.91).toFixed(2)} · ${pick(["HIGH","CRITICAL"])}` }),
      visualize: () => ({ kind: "sys", level: "info", source: src.code,
        msg: `layout force-directed iter=${Math.floor(between(40,180))} · stress ${between(0.04,0.18).toFixed(3)}` }),
      report:  () => ({ kind: "sys", level: "ok", source: src.code,
        msg: `compose brief · ${Math.floor(between(120,310))} tokens · model sentinel-graph-v2.4` }),
    };
    return (m[step?.key ?? "collect"] ?? m.collect)();
  }

  return { kind: "sys", level: "info", source: src.code, msg: "idle" };
}

function applyDelta(c: OpCounters, ev: Omit<LogEntry,"id"|"t">): OpCounters {
  const n = { ...c };
  switch (ev.kind) {
    case "fetch":  n.msgs += Math.floor(between(3, 22));  n.kb += between(0.5, 6.4); break;
    case "parse":  n.msgs += 1; n.kb += between(0.05, 0.4); break;
    case "dedup":  if (/DROP|collapsed|drop/.test(ev.msg)) n.dedupes += 1; break;
    case "ner":    n.entities += 1; break;
    case "embed":  break;
    case "link":   n.edges += 1; break;
    case "match":  n.edges += Math.random() < 0.4 ? 1 : 0; break;
    case "risk":   n.risk = Math.min(95, n.risk + between(0.5, 2.4)); break;
    case "alert":  n.alerts += 1; n.risk = Math.min(96, n.risk + between(1.5, 4)); break;
  }
  return n;
}

function useLiveOps(stage: Stage, phaseIdx: number, pipelineIdx: number, reduce: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [counters, setCounters] = useState<OpCounters>({ msgs: 0, kb: 0, dedupes: 0, entities: 0, edges: 0, alerts: 0, risk: 0 });
  const [perSource, setPerSource] = useState<Record<string, { msgs: number; kb: number; lastMs: number }>>({});
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
  const [pulses, setPulses] = useState<Record<string, number>>({});
  const onlineRef = useRef<string[]>([]);
  const startRef = useRef<number>(0);
  const idRef = useRef(0);
  const phaseRef = useRef(phaseIdx); useEffect(() => { phaseRef.current = phaseIdx; }, [phaseIdx]);
  const pipeRef  = useRef(pipelineIdx); useEffect(() => { pipeRef.current = pipelineIdx; }, [pipelineIdx]);
  const stageRef = useRef(stage); useEffect(() => { stageRef.current = stage; }, [stage]);

  useEffect(() => {
    if (stage === "idle") {
      setLogs([]); setCounters({ msgs: 0, kb: 0, dedupes: 0, entities: 0, edges: 0, alerts: 0, risk: 0 });
      setPerSource({}); setActiveSourceIds(new Set()); setPulses({});
      onlineRef.current = [];
      return;
    }
    if (stage !== "scanning" && stage !== "pipeline") return;
    if (startRef.current === 0) startRef.current = performance.now();

    // Progressively bring sources online — one every ~2.2s during scanning;
    // during pipeline all sources stay online.
    const onlineTimers: number[] = [];
    if (stage === "scanning" && onlineRef.current.length === 0) {
      const cadence = reduce ? 80 : 2200;
      SRC_CODES.forEach((s, i) => {
        const t = window.setTimeout(() => {
          onlineRef.current = Array.from(new Set([...onlineRef.current, s.code]));
          const sid = ID_FOR_CODE[s.code];
          if (sid) {
            setActiveSourceIds((prev) => { const n = new Set(prev); n.add(sid); return n; });
            setPulses((prev) => ({ ...prev, [sid]: performance.now() }));
          }
          // emit a deterministic "online" log so the user sees the sync
          idRef.current += 1;
          const elapsed = performance.now() - startRef.current;
          setLogs((prev) => {
            const next = prev.length > 120 ? prev.slice(-110) : prev.slice();
            next.push({
              id: idRef.current, t: ts(elapsed), kind: "sys", level: "ok", source: s.code,
              msg: `connected · tls1.3 · auth=ok · feed online`,
            });
            return next;
          });
        }, i * cadence);
        onlineTimers.push(t);
      });
    } else if (stage === "pipeline") {
      onlineRef.current = SRC_CODES.map((s) => s.code);
      setActiveSourceIds(new Set(SRC_CODES.map((s) => ID_FOR_CODE[s.code]).filter(Boolean)));
    }

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const st = stageRef.current;
      if (st !== "scanning" && st !== "pipeline") return;
      const ev = emitEvent(st, phaseRef.current, pipeRef.current, onlineRef.current);
      idRef.current += 1;
      const elapsed = performance.now() - startRef.current;
      const entry: LogEntry = { id: idRef.current, t: ts(elapsed), ...ev };
      setLogs((prev) => {
        const next = prev.length > 120 ? prev.slice(-110) : prev.slice();
        next.push(entry);
        return next;
      });
      setCounters((prev) => applyDelta(prev, ev));
      // Pulse the source that fired (sync with visual)
      const sid = ID_FOR_CODE[ev.source];
      if (sid) setPulses((prev) => ({ ...prev, [sid]: performance.now() }));
      if (ev.kind === "fetch" || ev.kind === "parse") {
        const mMatch = ev.msg.match(/· (\d+) items/);
        const kbMatch = ev.msg.match(/(\d+\.\d+) KB/);
        const msMatch = ev.msg.match(/(\d+)ms/);
        setPerSource((prev) => {
          const cur = prev[ev.source] ?? { msgs: 0, kb: 0, lastMs: 0 };
          return { ...prev, [ev.source]: {
            msgs: cur.msgs + (mMatch ? parseInt(mMatch[1]) : 1),
            kb:   cur.kb + (kbMatch ? parseFloat(kbMatch[1]) : 0.1),
            lastMs: msMatch ? parseInt(msMatch[1]) : cur.lastMs,
          }};
        });
      }
      const delay = reduce ? 30 : between(140, 520);
      window.setTimeout(tick, delay);
    };
    const initial = window.setTimeout(tick, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      onlineTimers.forEach((t) => window.clearTimeout(t));
    };
  }, [stage, reduce]);

  // reset start when going idle
  useEffect(() => { if (stage === "idle") startRef.current = 0; }, [stage]);

  return { logs, counters, perSource, activeSourceIds, pulses };
}

function DemoPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [pipelineIdx, setPipelineIdx] = useState(-1);
  const reduce = useReducedMotion();

  const dashRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);

  const { logs, counters, perSource, activeSourceIds, pulses } = useLiveOps(stage, phaseIdx, pipelineIdx, !!reduce);

  const runDemo = () => {
    if (stage !== "idle" && stage !== "brief") return;
    setStage("scanning");
    setProgress(0);
    setPhaseIdx(0);
    setPipelineIdx(-1);
  };

  // Scanning phase — light up sources, advance phases, drive progress
  useEffect(() => {
    if (stage !== "scanning") return;
    const start = performance.now();
    const DURATION = reduce ? 1800 : 22000;

    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setProgress(Math.round(p * 55)); // scanning fills 0 → 55%
      const phase = Math.min(SCAN_PHASES.length - 1, Math.floor(p * (SCAN_PHASES.length - 1)));
      setPhaseIdx(phase);

      if (p < 1) raf = requestAnimationFrame(tick);
      else setStage("pipeline");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, reduce]);

  // Pipeline phase — activate steps in sequence, drive progress to 100
  useEffect(() => {
    if (stage !== "pipeline") return;
    const stepMs = reduce ? 180 : 2200;
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
      setProgress(55 + Math.round((i / PIPELINE_STEPS.length) * 45));
    }, stepMs);
    return () => window.clearInterval(id);
  }, [stage, reduce]);

  // Reveal brief shortly after dashboard appears
  useEffect(() => {
    if (stage !== "dashboard") return;
    const t = window.setTimeout(() => setStage("brief"), reduce ? 500 : 3400);
    return () => window.clearTimeout(t);
  }, [stage, reduce]);

  // Auto-scroll into each section as it activates
  useEffect(() => {
    if (stage === "dashboard") dashRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (stage === "brief")     briefRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage]);

  const running = stage !== "idle";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#06090a] pt-14 text-foreground">
      <BackgroundFX />
      <DemoNav stage={stage} progress={progress} onRun={runDemo} />

      <CommandCenter stage={stage} progress={progress} phase={SCAN_PHASES[phaseIdx]} onRun={runDemo} running={running} />

      <CredibilityStrip stage={stage} progress={progress} counters={counters} />

      <LiveOpsConsole logs={logs} counters={counters} stage={stage} phase={SCAN_PHASES[phaseIdx]} pipelineStep={pipelineIdx >= 0 ? PIPELINE_STEPS[pipelineIdx]?.label : undefined} />

      <SourceScanningAnimation
        active={stage === "scanning" || stage === "pipeline" || stage === "dashboard" || stage === "brief"}
        scanning={stage === "scanning"}
        activeSources={activeSourceIds}
        pulses={pulses}
        phase={SCAN_PHASES[phaseIdx]}
        perSource={perSource}
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
              <AnalyticsDashboard counters={counters} />
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
  const t = useT();
  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-[color:var(--accent-signal)]/20 bg-[#06090a]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3 sm:gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded border border-[color:var(--accent-signal)]/40 bg-[color:var(--accent-signal)]/10 shadow-[0_0_18px_rgba(34,197,94,0.35)]">
          <ShieldAlert size={16} className="text-[color:var(--accent-signal)]" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-none tracking-wide text-foreground">SHADOWLESS</div>
        </div>

        <div className="mx-auto hidden items-center gap-2 rounded-full border border-[color:var(--accent-signal)]/25 bg-black/30 px-3 py-1 md:flex">
          <span className={cn(
            "h-2 w-2 rounded-full",
            live ? "bg-[color:var(--accent-signal)] shadow-[0_0_10px_var(--accent-signal)] animate-pulse" : "bg-foreground/40",
          )} />
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-foreground/70">
            {live ? `${t("landing.nav.operating")} · ${progress}%` : t("landing.nav.standby")}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher variant="chip" />
          <Link
            to="/workspace"
            className="mono hidden h-9 items-center gap-1.5 rounded border border-foreground/15 bg-black/40 px-3 text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition hover:border-[color:var(--accent-signal)]/45 hover:text-[color:var(--accent-signal)] sm:inline-flex"
          >
            {t("landing.nav.workspace")} <ExternalLink size={12} />
          </Link>
          <button
            onClick={onRun}
            className="inline-flex h-9 items-center gap-2 rounded border border-[color:var(--accent-signal)]/60 bg-[color:var(--accent-signal)]/15 px-3 text-[12.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent-signal)] transition hover:bg-[color:var(--accent-signal)]/25"
          >
            <Play size={13} /> {stage === "idle" ? t("landing.nav.start") : t("landing.nav.replay")}
          </button>
        </div>
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
  const t = useT();
  return (
    <section className="relative z-10 flex min-h-[88vh] items-center justify-center px-5 pt-10 pb-16 sm:pt-16">
      {/* ambient radar behind the headline */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.18]">
        <div className="aspect-square w-[min(720px,90vw)]">
          <RadarVisual running={running} progress={progress} />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <h1 className="text-[44px] font-black leading-[0.95] tracking-tight text-foreground sm:text-[68px] lg:text-[88px]" style={{ textWrap: "balance" } as React.CSSProperties}>
          <span className="block">{t("hero.title.line1")}</span>
          <span className="block bg-gradient-to-r from-[color:var(--accent-signal)] via-[color:var(--accent-signal)] to-emerald-200 bg-clip-text text-transparent">
            {t("hero.title.line2")}
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-foreground/65 sm:text-[17px]">{t("hero.sub")}</p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={onRun}
            className={cn(
              "group relative inline-flex h-13 items-center gap-2.5 overflow-hidden rounded border border-[color:var(--accent-signal)]/70 bg-[color:var(--accent-signal)] px-6 py-3.5 text-[13.5px] font-bold uppercase tracking-[0.18em] text-black transition",
              "shadow-[0_0_0_1px_rgba(34,197,94,0.3),0_10px_50px_-6px_rgba(34,197,94,0.6)] hover:shadow-[0_0_0_1px_rgba(34,197,94,0.5),0_14px_60px_-4px_rgba(34,197,94,0.78)]",
            )}
          >
            <Zap size={14} />
            {running ? t("hero.cta.rerun") : t("hero.cta.run")}
            <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            <span aria-hidden className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 opacity-0 transition group-hover:opacity-60 group-hover:translate-x-[400%]" />
          </button>
          <div className="mono flex items-center gap-2 rounded border border-foreground/15 bg-black/50 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-foreground/60">
            <ScanLine size={12} className="text-[color:var(--accent-signal)]" />
            {running ? `${t(`phase.${phase}`)} · ${progress}%` : t("hero.await")}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Credibility Strip ─────────────────────────────── */

function CredibilityStrip({ stage, progress, counters }: { stage: Stage; progress: number; counters: OpCounters }) {
  const t = useT();
  // Sync: while running, scale targets by progress so the cred strip ticks in
  // lock-step with the live operations console and the progress bar.
  const pct = stage === "idle" ? 0 : Math.max(progress / 100, 0);
  const sources = stage === "idle" ? 0
    : stage === "brief" || stage === "dashboard"
      ? DEMO_METRICS.sourcesMonitored
      : Math.max(1, Math.round(DEMO_METRICS.sourcesMonitored * pct));
  const signals = stage === "brief" || stage === "dashboard"
    ? DEMO_METRICS.signalsProcessed
    : Math.max(counters.msgs, Math.round(DEMO_METRICS.signalsProcessed * pct));
  const entities = stage === "brief" || stage === "dashboard"
    ? DEMO_METRICS.entitiesExtracted
    : Math.max(counters.entities, Math.round(DEMO_METRICS.entitiesExtracted * pct));
  const clusters = stage === "brief" || stage === "dashboard"
    ? DEMO_METRICS.highRiskClusters
    : Math.max(counters.alerts, Math.round(DEMO_METRICS.highRiskClusters * pct));
  const hours = stage === "brief" || stage === "dashboard"
    ? DEMO_METRICS.analystHoursSaved
    : Math.round(DEMO_METRICS.analystHoursSaved * pct);
  return (
    <section className="relative z-10 border-y border-[color:var(--accent-signal)]/15 bg-black/30 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 lg:grid-cols-[1.1fr_2fr] lg:items-center">
        <div>
          <div className="text-[13px] leading-relaxed text-foreground/75">
            {t("cred.builtfor")} <span className="text-foreground">{t("cred.builtfor.targets")}</span>.
          </div>
          <div className="mono mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] uppercase tracking-[0.18em] text-foreground/45">
            <span>{t("cred.tag.provenance")}</span>
            <span aria-hidden>·</span>
            <span>{t("cred.tag.hitl")}</span>
            <span aria-hidden>·</span>
            <span>{t("cred.tag.audit")}</span>
            <span aria-hidden>·</span>
            <span>{t("cred.tag.lawful")}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 md:gap-3">
          <MetricCard icon={Database} label={t("cred.metric.sources")}  value={sources} />
          <MetricCard icon={Signal}   label={t("cred.metric.signals")}  value={signals} />
          <MetricCard icon={Users}    label={t("cred.metric.entities")} value={entities} />
          <MetricCard icon={Target}   label={t("cred.metric.clusters")} value={clusters} accent />
          <MetricCard icon={Gauge}    label={t("cred.metric.hours")}    value={hours} suffix="h" />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon, label, value, suffix, accent,
}: { icon: any; label: string; value: number; suffix?: string; accent?: boolean }) {
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
        <motion.span
          key={value}
          initial={{ opacity: 0.6, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={cn("mono text-[30px] font-bold leading-none tabular-nums", accent ? "text-[color:var(--accent-signal)]" : "text-foreground")}
        >
          {value.toLocaleString()}
        </motion.span>
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
  active, scanning, activeSources, phase, perSource, pulses,
}: { active: boolean; scanning: boolean; activeSources: Set<string>; phase: string; perSource: Record<string, { msgs: number; kb: number; lastMs: number }>; pulses: Record<string, number> }) {
  const t = useT();
  // map demo source id → live counter code
  const codeFor = CODE_FOR_ID;
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
        eyebrow={t("sec.sources.eyebrow")}
        title={t("sec.sources.title")}
        sub={t("sec.sources.sub")}
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
              {active ? t(`phase.${phase}`) : t("common.standby")}
            </div>
          </div>

          {/* source nodes */}
          {positions.map((p, i) => {
            const s = DEMO_SOURCES[i];
            const lit = activeSources.has(s.id);
            const pulseKey = pulses[s.id] ?? 0;
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
                {lit && (
                  <motion.span
                    key={pulseKey}
                    className="pointer-events-none absolute inset-0 rounded-full border border-[color:var(--accent-signal)]"
                    initial={{ scale: 1, opacity: 0.9 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Source list */}
        <div className="flex flex-col gap-2">
          {DEMO_SOURCES.map((s, i) => {
            const lit = activeSources.has(s.id);
            const pc = perSource[codeFor[s.id]] ?? { msgs: 0, kb: 0, lastMs: 0 };
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
                    {t(`src.kind.${s.kind}`)} · {t("src.reliability")} {s.reliability}% · {pc.msgs} {t("src.msgs")} · {pc.kb.toFixed(1)} KB{pc.lastMs ? ` · ${pc.lastMs}ms` : ""}
                  </div>
                </div>
                <span className={cn(
                  "mono shrink-0 text-[10.5px] uppercase tracking-[0.18em]",
                  lit ? "text-[color:var(--accent-signal)]" : "text-foreground/40",
                )}>
                  {lit ? t("src.streaming") : t("src.standby")}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Live Ops Console ─────────────────────────── */

function LiveOpsConsole({
  logs, counters, stage, phase, pipelineStep,
}: { logs: LogEntry[]; counters: OpCounters; stage: Stage; phase: string; pipelineStep?: string }) {
  const t = useT();
  const viewportRef = useRef<HTMLDivElement>(null);
  // auto-scroll to bottom on new log
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const running = stage === "scanning" || stage === "pipeline";
  const stageLabel =
    stage === "scanning" ? `${t("ops.stage.scanning")} · ${t(`phase.${phase}`)}` :
    stage === "pipeline" ? `${t("ops.stage.pipeline")} · ${pipelineStep ?? "…"}` :
    stage === "dashboard" ? t("ops.stage.dashboard") :
    stage === "brief"     ? t("ops.stage.brief") : t("ops.stage.standby");

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:py-16">
      <SectionHeader
        eyebrow={t("sec.ops.eyebrow")}
        title={t("sec.ops.title")}
        sub={t("sec.ops.sub")}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        {/* Terminal */}
        <div className="overflow-hidden rounded-lg border border-[color:var(--accent-signal)]/25 bg-black/70 shadow-[0_0_50px_-18px_rgba(34,197,94,0.55)] backdrop-blur">
          {/* chrome */}
          <div className="flex items-center gap-2 border-b border-foreground/10 bg-black/60 px-3 py-2">
            <Terminal size={13} className="text-[color:var(--accent-signal)]" />
            <span className="mono text-[10.5px] uppercase tracking-[0.2em] text-foreground/70">{t("ops.console.title")}</span>
            <span className="mono ml-auto flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.2em] text-foreground/55">
              <span className={cn("h-1.5 w-1.5 rounded-full", running ? "bg-[color:var(--accent-signal)] animate-pulse" : "bg-foreground/40")} />
              {stageLabel}
            </span>
          </div>
          <div
            ref={viewportRef}
            className="h-[360px] overflow-y-auto px-3 py-3 font-mono text-[11.5px] leading-[1.55]"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {logs.length === 0 && (
              <div className="grid h-full place-items-center text-foreground/35">
                <div className="text-center">
                  <div className="mono text-[11px] uppercase tracking-[0.2em]">{t("ops.console.empty.title")}</div>
                  <div className="mt-1 text-[11px] text-foreground/45">{t("ops.console.empty.hint")}</div>
                </div>
              </div>
            )}
            <AnimatePresence initial={false}>
              {logs.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex gap-2 whitespace-pre-wrap break-words"
                >
                  <span className="shrink-0 text-foreground/35">{l.t}</span>
                  <span className={cn(
                    "shrink-0 rounded px-1 text-[10px] font-bold uppercase tracking-wider",
                    KIND_STYLE[l.kind],
                  )}>{l.kind}</span>
                  <span className="shrink-0 text-foreground/45">{l.source}</span>
                  <span className={cn(
                    LEVEL_STYLE[l.level],
                  )}>{l.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Live counters */}
        <div className="flex flex-col gap-2.5">
          <CounterTile label={t("ops.counter.messages")} value={counters.msgs.toLocaleString()} />
          <CounterTile label={t("ops.counter.payload")}  value={`${counters.kb.toFixed(1)} KB`} />
          <CounterTile label={t("ops.counter.dedupes")}  value={String(counters.dedupes)} />
          <CounterTile label={t("ops.counter.entities")} value={String(counters.entities)} />
          <CounterTile label={t("ops.counter.links")}    value={String(counters.edges)} />
          <CounterTile label={t("ops.counter.alerts")}   value={String(counters.alerts)} accent={counters.alerts > 0} />
          <div className="rounded border border-[color:var(--risk-critical)]/30 bg-black/40 p-3 backdrop-blur">
            <div className="mono flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              <span>{t("ops.counter.risk")}</span>
              <span className="text-[color:var(--risk-critical)]">{counters.risk.toFixed(0)} / 100</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-foreground/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[color:var(--risk-medium)] via-[color:var(--risk-high)] to-[color:var(--risk-critical)]"
                animate={{ width: `${counters.risk}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const KIND_STYLE: Record<LogKind, string> = {
  fetch:    "bg-[color:var(--accent-signal)]/15 text-[color:var(--accent-signal)]",
  parse:    "bg-foreground/10 text-foreground/70",
  dedup:    "bg-foreground/10 text-foreground/70",
  lang:     "bg-foreground/10 text-foreground/70",
  ner:      "bg-[color:var(--accent-signal)]/15 text-[color:var(--accent-signal)]",
  embed:    "bg-foreground/10 text-foreground/70",
  match:    "bg-[color:var(--risk-medium)]/15 text-[color:var(--risk-medium)]",
  link:     "bg-[color:var(--accent-signal)]/15 text-[color:var(--accent-signal)]",
  risk:     "bg-[color:var(--risk-high)]/15 text-[color:var(--risk-high)]",
  alert:    "bg-[color:var(--risk-critical)]/20 text-[color:var(--risk-critical)]",
  geo:      "bg-foreground/10 text-foreground/70",
  wallet:   "bg-foreground/10 text-foreground/70",
  translate:"bg-foreground/10 text-foreground/70",
  score:    "bg-[color:var(--risk-high)]/15 text-[color:var(--risk-high)]",
  sys:      "bg-foreground/[0.06] text-foreground/55",
};

const LEVEL_STYLE: Record<LogLevel, string> = {
  info: "text-foreground/85",
  ok:   "text-foreground/90",
  warn: "text-[color:var(--risk-high)]",
  crit: "text-[color:var(--risk-critical)] font-semibold",
};

function CounterTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <motion.div
      layout
      className={cn(
        "rounded border bg-black/40 p-3 backdrop-blur",
        accent ? "border-[color:var(--risk-critical)]/45 shadow-[0_0_24px_-10px_rgba(239,68,68,0.55)]" : "border-foreground/10",
      )}
    >
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">{label}</div>
      <div className={cn(
        "mono mt-1 text-[22px] font-bold leading-none tabular-nums",
        accent ? "text-[color:var(--risk-critical)]" : "text-foreground",
      )}>{value}</div>
    </motion.div>
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
        eyebrow="pipeline"
        title="Intelligence pipeline"
        sub="Raw signals → defensible analyst brief."
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

function AnalyticsDashboard({ counters }: { counters: OpCounters }) {
  const risk = Math.max(1, Math.round(counters.risk || 87));
  const riskLabel = risk >= 80 ? "Critical" : risk >= 60 ? "High" : risk >= 40 ? "Medium" : "Low";
  const riskColor = risk >= 80 ? "var(--risk-critical)" : risk >= 60 ? "var(--risk-high)" : "var(--risk-medium)";
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:py-14">
      <SectionHeader
        eyebrow="dashboard"
        title="Analytics dashboard"
        sub="Synthesized intelligence at a glance."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        {/* Risk score */}
        <Panel className="lg:col-span-3" title="Aggregate risk" icon={ShieldAlert}>
          <div className="flex items-baseline gap-2">
            <span className="mono text-[44px] font-bold leading-none tabular-nums" style={{ color: riskColor }}>{risk}</span>
            <span className="mono text-[12px] text-foreground/50">/ 100</span>
          </div>
          <div className="mono mt-1 text-[10.5px] uppercase tracking-[0.18em]" style={{ color: riskColor }}>{riskLabel}</div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-foreground/10">
            <motion.div
              className="h-full bg-gradient-to-r from-[color:var(--risk-medium)] via-[color:var(--risk-high)] to-[color:var(--risk-critical)]"
              initial={{ width: 0 }} animate={{ width: `${risk}%` }} transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Stat label="Confidence" value={DEMO_METRICS.confidence} />
            <Stat label="Entities" value={String(counters.entities)} />
            <Stat label="Alerts" value={String(counters.alerts)} />
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
        eyebrow="brief"
        title="Investigator brief"
        sub="Auto-generated. Fully attributable. Ready for handoff."
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
            <BriefBtn
              icon={Download}
              label="PDF"
              primary
              onClick={() => downloadBriefPdf()}
            />
            <BriefBtn
              icon={FileText}
              label="Case File"
              to="/workspace"
            />
            <BriefBtn
              icon={Share2}
              label="Share with Analyst"
              onClick={() => {
                const url = typeof window !== "undefined" ? window.location.href : "";
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(url).catch(() => {});
                }
                toast("Share link copied", { description: "KZ-2048 brief link copied to clipboard." });
              }}
            />
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
                {DEMO_SOURCES.slice(0, 4).map((s) => (
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
                {SIGNALS_FEED.slice(0, 4).map((s, i) => (
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
                Simulated data. Production runs on pre-approved feeds with full audit trail.
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

function BriefBtn({
  icon: Icon, label, primary, onClick, to,
}: { icon: any; label: string; primary?: boolean; onClick?: () => void; to?: string }) {
  const className = cn(
    "inline-flex h-9 items-center gap-1.5 rounded px-3 text-[12px] font-bold uppercase tracking-[0.14em] transition",
    primary
      ? "border border-[color:var(--accent-signal)]/60 bg-[color:var(--accent-signal)] text-black shadow-[0_6px_24px_-8px_rgba(34,197,94,0.65)] hover:shadow-[0_8px_30px_-6px_rgba(34,197,94,0.8)]"
      : "border border-foreground/15 bg-black/40 text-foreground/80 hover:border-[color:var(--accent-signal)]/45 hover:text-[color:var(--accent-signal)]",
  );
  if (to) {
    return (
      <Link to={to as any} className={className}>
        <Icon size={12} /> {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      <Icon size={12} /> {label}
    </button>
  );
}

function downloadBriefPdf() {
  const content = [
    "SHADOWLESS · CASE BRIEF KZ-2048 (Simulated)",
    "Generated · Sentinel Agent v2.4",
    "",
    "EXECUTIVE SUMMARY",
    GENERATED_SUMMARY,
    "",
    "KEY FINDINGS",
    ...KEY_FINDINGS.map((f, i) => `KF-${String(i + 1).padStart(2, "0")}  ${f}`),
    "",
    "RECOMMENDED NEXT ACTIONS",
    ...NEXT_ACTIONS.map((a, i) => `${i + 1}. ${a}`),
    "",
    "— Simulated data. For demonstration only.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shadowless-brief-KZ-2048.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Brief exported", { description: "shadowless-brief-KZ-2048.txt" });
}

/* ─────────────────────────────── Helpers ──────────────────────────────────── */

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div data-section={eyebrow} className="flex max-w-3xl items-end gap-3">
      <span aria-hidden className="mb-2 inline-block h-px w-8 shrink-0 bg-[color:var(--accent-signal)]/60" />
      <div>
        <h2 className="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[34px]">{title}</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/55 sm:text-[14.5px]">{sub}</p>
      </div>
    </div>
  );
}