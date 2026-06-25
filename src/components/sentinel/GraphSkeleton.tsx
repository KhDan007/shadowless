import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

// Pseudo-random but stable node positions (percent coords inside the viewport).
const NODES: Array<{ x: number; y: number; r: number; delay: number }> = [
  { x: 18, y: 28, r: 22, delay: 0.0 },
  { x: 42, y: 18, r: 16, delay: 0.15 },
  { x: 68, y: 30, r: 26, delay: 0.05 },
  { x: 86, y: 22, r: 14, delay: 0.35 },
  { x: 30, y: 56, r: 18, delay: 0.2 },
  { x: 54, y: 48, r: 28, delay: 0.1 },
  { x: 78, y: 60, r: 20, delay: 0.25 },
  { x: 20, y: 78, r: 16, delay: 0.4 },
  { x: 46, y: 82, r: 22, delay: 0.3 },
  { x: 72, y: 84, r: 18, delay: 0.45 },
  { x: 90, y: 70, r: 14, delay: 0.5 },
];

const EDGES: Array<[number, number]> = [
  [0, 4], [1, 5], [2, 5], [2, 3], [3, 10],
  [4, 5], [5, 6], [5, 8], [6, 10], [4, 7],
  [7, 8], [8, 9], [9, 10], [6, 9], [1, 2],
];

export function GraphSkeleton() {
  const { t } = useI18n();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-busy="true"
      aria-live="polite"
    >
      {/* dim wash over the dotted grid */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />

      {/* radial scanning sweep */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--primary) 18%, transparent) 0%, transparent 38%)",
        }}
        animate={{ scale: [0.6, 1.05, 0.6], opacity: [0.0, 0.55, 0.0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gskel-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* base faint edges */}
        {EDGES.map(([a, b], i) => {
          const A = NODES[a], B = NODES[b];
          return (
            <line
              key={`base-${i}`}
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="var(--panel-border)"
              strokeWidth={0.18}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* animated data-flow edges */}
        {EDGES.map(([a, b], i) => {
          const A = NODES[a], B = NODES[b];
          return (
            <motion.line
              key={`flow-${i}`}
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="url(#gskel-edge)"
              strokeWidth={0.35}
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{
                opacity: [0, 0.9, 0],
                strokeDashoffset: [0, -12],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % 6) * 0.18,
              }}
            />
          );
        })}
      </svg>

      {/* skeleton nodes (absolute %) */}
      {NODES.map((n, i) => (
        <motion.div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.9, 1, 0.9] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: n.delay,
          }}
        >
          <div
            className="rounded-full border border-primary/40 bg-secondary/70 shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
            style={{ width: n.r, height: n.r }}
          />
        </motion.div>
      ))}

      {/* terminal-style status pill */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-secondary/95 px-3 py-2 backdrop-blur shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            {t("g.skeleton.title")}
          </span>
          <span className="h-3 w-px bg-muted" />
          <LoadingDots />
          <span className="mono text-[11px] text-muted-foreground">
            {t("g.skeleton.sub")}
          </span>
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-primary"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}
