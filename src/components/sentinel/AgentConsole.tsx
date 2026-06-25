import { useMemo } from "react";
import { Terminal, Trash2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentConsole, type ConsoleEntry } from "./agentConsoleStore";
import { useI18n } from "@/i18n";

function tsLabel(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function levelClass(e: ConsoleEntry) {
  if (e.level === "crit") return "text-destructive";
  if (e.level === "ok") return "text-primary";
  if (e.type === "plan" || e.type === "expand") return "text-muted-foreground";
  return "text-foreground/90";
}

function typeTag(type: ConsoleEntry["type"]) {
  return type.toUpperCase().replace("_", " ");
}

export function AgentConsole({ bare = false }: { bare?: boolean } = {}) {
  const entries = useAgentConsole((s) => s.entries);
  const conn = useAgentConsole((s) => s.conn);
  const clear = useAgentConsole((s) => s.clear);
  const { t } = useI18n();

  const connDot = useMemo(() => {
    if (conn === "live") return { c: "bg-primary", l: t("console.conn.live") };
    if (conn === "reconnecting" || conn === "connecting")
      return { c: "bg-[var(--risk-medium)]", l: t("console.conn.reconn") };
    return { c: "bg-muted-foreground", l: t("console.conn.off") };
  }, [conn, t]);

  return (
    <div className={cn("flex h-full flex-col", !bare && "border border-border bg-card")}>
      <header className="flex h-8 shrink-0 items-center gap-2 border-b border-border bg-background px-2.5">
        <Terminal size={12} className="text-primary" />
        <span className="mono text-[11px] font-bold uppercase tracking-[0.16em] text-foreground">
          {t("console.title")}
        </span>
        <span className="mono inline-flex items-center gap-1.5 rounded-sm border border-border px-1.5 py-px text-[10.5px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", connDot.c)} />
          {connDot.l}
        </span>
        <span className="mono ml-auto text-[10.5px] text-muted-foreground">
          {t("console.count", { n: entries.length })}
        </span>
        <button
          onClick={clear}
          disabled={entries.length === 0}
          title={t("console.clear")}
          className="inline-flex h-6 items-center gap-1 rounded-sm border border-border bg-background px-1.5 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Trash2 size={10} /> {t("console.clear")}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-background">
        {entries.length === 0 ? (
          <div className="mono flex h-full items-center justify-center gap-2 text-[12px] text-muted-foreground">
            <Radio size={12} className="animate-pulse" /> {t("console.empty")}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((e) => (
              <li key={e.id} className="grid grid-cols-[auto_auto_1fr] items-baseline gap-2 px-2.5 py-1">
                <span className="mono text-[10.5px] text-muted-foreground tabular-nums">
                  [{tsLabel(e.ts)}]
                </span>
                <span
                  className={cn(
                    "mono inline-block w-[88px] truncate text-[10px] font-bold uppercase tracking-[0.12em]",
                    e.level === "crit" && "text-destructive",
                    e.level === "ok" && "text-primary",
                    e.level === "info" && "text-foreground/60",
                  )}
                  title={typeTag(e.type)}
                >
                  {typeTag(e.type)}
                </span>
                <span className={cn("mono text-[12px] leading-snug", levelClass(e))}>
                  {e.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}