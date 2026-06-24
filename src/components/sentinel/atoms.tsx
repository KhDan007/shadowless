import { cn } from "@/lib/utils";
import type { RiskLevel } from "./data";

export const riskMeta: Record<RiskLevel, { label: string; bg: string; text: string; dot: string }> = {
  low:      { label: "LOW",      bg: "bg-[#2a1f00]", text: "text-[#ffc94d]", dot: "bg-[#ffc94d]" },
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
    neutral: "border-[#2a2a2a] text-[#b8b8b8] bg-[#111111]",
    good: "border-emerald-accent/40 text-emerald-accent bg-[#2a1f00]",
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
    <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-[12px] font-bold tracking-[0.12em] text-[#b8b8b8] uppercase">{title}</h3>
        {hint && <span className="mono text-[11px] text-[#8a8a8a]">{hint}</span>}
      </div>
      {right}
    </div>
  );
}

export function Panel({
  children, className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col rounded bg-[#111111] border border-[#2a2a2a]", className)}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "risk" }) {
  const color =
    tone === "risk"
      ? value >= 80 ? "#ff5d6c" : value >= 60 ? "#ff8a4c" : value >= 40 ? "#f5b850" : "#ffc94d"
      : "#ffb000";
  return (
    <div className="h-1.5 w-full rounded-full bg-[#0a0a0a] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
      />
    </div>
  );
}

export function MonoKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-[#2a2a2a] last:border-0">
      <span className="text-[11px] font-bold tracking-[0.1em] text-[#8a8a8a] uppercase">{k}</span>
      <span className="mono text-[12px] text-[#e8e8e8] truncate">{v}</span>
    </div>
  );
}