import { useEffect, useState } from "react";
import { useSentinelData } from "./store";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useRouterState } from "@tanstack/react-router";

/**
 * Live ticker — single mono row above the hint strip.
 * Pulls from logRows; advances a head pointer every ~3s with a discrete step
 * (no easing, no glow). Clicking a row focuses the related entity in the graph.
 * Bureau direction: a real operations feed, not a marquee.
 */
export function LiveTicker() {
  const rows = useSentinelData((s) => s.logRows);
  const entities = useSentinelData((s) => s.entities);
  const [head, setHead] = useState(0);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (rows.length === 0) return;
    const id = window.setInterval(() => {
      setHead((h) => (h + 1) % rows.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [rows.length]);

  if (rows.length === 0) return null;

  // Show a sliding window of 3 rows: previous, current, next.
  const len = rows.length;
  const visible = [
    rows[(head - 1 + len) % len],
    rows[head],
    rows[(head + 1) % len],
  ];

  const focus = (entityLabel: string) => {
    const e = entities.find((x) => x.label.includes(entityLabel) || x.alias === entityLabel);
    if (!e) {
      // Fall back: show the evidence dock so the operator can find the row.
      try { sessionStorage.setItem("sentinel.pendingDockTab", "evidence"); } catch {}
      if (pathname !== "/") navigate({ to: "/" });
      else window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: "evidence" }));
      return;
    }
    if (pathname !== "/") {
      try { sessionStorage.setItem("sentinel.pendingSelectEntity", e.id); } catch {}
      navigate({ to: "/" }).then(() => {
        window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: e.id }));
      });
    } else {
      window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: e.id }));
    }
  };

  return (
    <div className="relative flex h-7 shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-background px-3">
      <div className="flex shrink-0 items-center gap-1.5 border-r border-border pr-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-primary">
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary" />
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
        </span>
        <Radio size={10} />
        LIVE FEED
      </div>
      <div className="relative flex min-w-0 flex-1 items-center">
        {visible.map((r, i) => (
          <button
            key={`${r.id}-${i}-${head}`}
            onClick={() => focus(r.entity)}
            title={`${r.id} · ${r.finding}`}
            className={cn(
              "mono shrink-0 truncate px-2 text-left text-[11.5px] transition-opacity duration-200",
              i === 1 ? "max-w-[60ch] flex-1 text-foreground/90 opacity-100" : "max-w-[30ch] text-muted-foreground opacity-40 hover:opacity-70",
            )}
          >
            <span className="text-muted-foreground">{r.time.slice(11)}</span>{" "}
            <span className="text-primary">{r.source}</span>{" › "}
            <span className="text-foreground">{r.entity}</span>{" "}
            <span className="text-foreground/70">{r.finding}</span>
          </button>
        ))}
      </div>
      <div className="mono hidden shrink-0 items-center gap-1 border-l border-border pl-3 text-[10.5px] text-muted-foreground sm:flex">
        {String(head + 1).padStart(3, "0")} / {String(rows.length).padStart(3, "0")}
      </div>
    </div>
  );
}