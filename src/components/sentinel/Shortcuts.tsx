import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

/**
 * Global keyboard shortcuts.
 *
 * Every binding here matches a tip surfaced in HintStrip or Onboarding, so
 * the hints aren't lying: pressing the key actually does the thing. The
 * handler ignores keys while the user is typing in an input.
 */
export const SHORTCUTS: { keys: string; label: string; group: string }[] = [
  { keys: "⌘ K", label: "Open command palette", group: "Navigation" },
  { keys: "G",   label: "Refocus the graph (fit view)", group: "Navigation" },
  { keys: "T",   label: "Open the timeline", group: "Navigation" },
  { keys: "O",   label: "Open the case overview", group: "Navigation" },
  { keys: "E",   label: "Open the evidence dock tab", group: "Dock" },
  { keys: "F",   label: "Open the AI findings dock tab", group: "Dock" },
  { keys: "A",   label: "Open the alerts dock tab", group: "Dock" },
  { keys: "L",   label: "Open the live timeline dock tab", group: "Dock" },
  { keys: "R",   label: "Recompute risk on visible signals", group: "Analysis" },
  { keys: "Shift + click",  label: "Multi-select nodes on the graph", group: "Graph" },
  { keys: "Right-click",    label: "Open node actions (pin / redact / dossier)", group: "Graph" },
  { keys: "?",   label: "Show this shortcuts cheatsheet", group: "Help" },
  { keys: "Esc", label: "Clear selection / close menus", group: "Help" },
];

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  // Radix sets role="dialog" on open modals — let them keep focus there.
  if (el.closest('[role="dialog"]')) return true;
  return false;
}

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const openDockTab = (tab: "evidence" | "ai" | "alerts" | "timeline" | "trends") => {
      try { sessionStorage.setItem("sentinel.pendingDockTab", tab); } catch {}
      if (pathname !== "/") {
        navigate({ to: "/" }).then(() => {
          window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: tab }));
        });
      } else {
        window.dispatchEvent(new CustomEvent("sentinel:open-dock-tab", { detail: tab }));
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isTyping(e.target)) return;
      const k = e.key;
      switch (k.toLowerCase()) {
        case "g":
          e.preventDefault();
          if (pathname !== "/") navigate({ to: "/" }).then(() => {
            window.dispatchEvent(new CustomEvent("sentinel:graph-fit"));
          });
          else window.dispatchEvent(new CustomEvent("sentinel:graph-fit"));
          toast("Graph refocused");
          break;
        case "t":
          e.preventDefault();
          navigate({ to: "/timeline" });
          break;
        case "o":
          e.preventDefault();
          navigate({ to: "/overview" });
          break;
        case "e":
          e.preventDefault();
          openDockTab("evidence");
          break;
        case "f":
          e.preventDefault();
          openDockTab("ai");
          break;
        case "a":
          e.preventDefault();
          openDockTab("alerts");
          break;
        case "l":
          e.preventDefault();
          openDockTab("timeline");
          break;
        case "r":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("sentinel:risk-recompute"));
          toast.success("Risk recomputed — check contributing signals in the entity panel");
          break;
        case "?":
          e.preventDefault();
          setHelpOpen((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, pathname]);

  useEffect(() => {
    const onOpen = () => setHelpOpen(true);
    window.addEventListener("sentinel:open-shortcuts", onOpen);
    return () => window.removeEventListener("sentinel:open-shortcuts", onOpen);
  }, []);

  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-lg border-border bg-secondary text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.12em] text-primary">
            <Keyboard size={14} /> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-muted-foreground">
            Every tip the workspace shows you maps to one of these keys.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g}>
              <div className="mono mb-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{g}</div>
              <ul className="space-y-1">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <li key={s.keys} className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="text-foreground/85">{s.label}</span>
                    <kbd className="mono shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10.5px] font-bold text-primary">
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}