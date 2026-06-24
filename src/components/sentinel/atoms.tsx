import { cn } from "@/lib/utils";
import type { RiskLevel } from "./data";

export const riskMeta: Record<RiskLevel, { label: string; bg: string; text: string; dot: string }> = {
  low:      { label: "LOW",      bg: "bg-[#0f2a22]", text: "text-[#4edea3]", dot: "bg-[#4edea3]" },
  medium:   { label: "MEDIUM",   bg: "bg-[#2a2113]", text: "text-[#f5b850]", dot: "bg-[#f5b850]" },
  high:     { label: "HIGH",     bg: "bg-[#2d1c12]", text: "text-[#ff8a4c]", dot: "bg-[#ff8a4c]" },
  critical: { label: "CRITICAL", bg: "bg-[#2d1217]", text: "text-[#ff5d6c]", dot: "bg-[#ff5d6c]" },
};

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  const m = riskMeta[risk];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-bold tracking-[0.08em]",
        m.bg, m.text, className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function StatusChip({
  status,
  children,
  tone = "neutral",
}: {
  status?: string;
  children?: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    neutral: "border-[#30363d] text-[#bbcabf] bg-[#161b22]",
    good: "border-emerald-accent/40 text-emerald-accent bg-[#0f2a22]",
    warn: "border-[#5a4416] text-[#f5b850] bg-[#241a0d]",
    bad: "border-[#5a1f25] text-[#ff5d6c] bg-[#2d1217]",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase", toneClass)}>
      {children ?? status}
    </span>
  );
}

export function PanelHeader({
  title, hint, right,
}: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1f2630] px-3 py-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-[12px] font-bold tracking-[0.12em] text-[#bbcabf] uppercase">{title}</h3>
        {hint && <span className="mono text-[11px] text-[#5a6573]">{hint}</span>}
      </div>
      {right}
    </div>
  );
}

export function Panel({
  children, className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col rounded bg-[#161b22] border border-[#1f2630]", className)}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "risk" }) {
  const color =
    tone === "risk"
      ? value >= 80 ? "#ff5d6c" : value >= 60 ? "#ff8a4c" : value >= 40 ? "#f5b850" : "#4edea3"
      : "#10b981";
  return (
    <div className="h-1.5 w-full rounded-full bg-[#0d1117] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
      />
    </div>
  );
}

export function MonoKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-[#1f2630] last:border-0">
      <span className="text-[11px] font-bold tracking-[0.1em] text-[#5a6573] uppercase">{k}</span>
      <span className="mono text-[12px] text-[#e1e2eb] truncate">{v}</span>
    </div>
  );
}