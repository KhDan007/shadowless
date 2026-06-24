import { cn } from "@/lib/utils";
import type { RiskLevel } from "./data";

export const riskMeta: Record<RiskLevel, { label: string; bg: string; text: string; dot: string }> = {
  low:      { label: "LOW",      bg: "bg-primary/15", text: "text-primary", dot: "bg-primary" },
  medium:   { label: "MEDIUM",   bg: "bg-primary/20", text: "text-[color:var(--risk-medium)]", dot: "bg-[color:var(--risk-medium)]" },
  high:     { label: "HIGH",     bg: "bg-[color:var(--risk-high)]/15", text: "text-[color:var(--risk-high)]", dot: "bg-[color:var(--risk-high)]" },
  critical: { label: "CRITICAL", bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive" },
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
    neutral: "border-border text-foreground/80 bg-secondary",
    good: "border-emerald-accent/40 text-emerald-accent bg-primary/15",
    warn: "border-[#3a362f] text-[color:var(--risk-medium)] bg-primary/15",
    bad: "border-[#3a362f] text-destructive bg-destructive/15",
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
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-[12px] font-bold tracking-[0.12em] text-foreground/80 uppercase">{title}</h3>
        {hint && <span className="mono text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {right}
    </div>
  );
}

export function Panel({
  children, className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col rounded bg-secondary border border-border", className)}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "risk" }) {
  const color =
    tone === "risk"
      ? value >= 80 ? "#b91c1c" : value >= 60 ? "#d97706" : value >= 40 ? "#e0a04a" : "#b8a884"
      : "#d97706";
  return (
    <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
      />
    </div>
  );
}

export function MonoKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-border last:border-0">
      <span className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">{k}</span>
      <span className="mono text-[12px] text-foreground truncate">{v}</span>
    </div>
  );
}