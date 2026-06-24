import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { useI18n } from "@/i18n";

export const SHORTCUTS: { keys: string; labelKey: string; groupKey: string }[] = [
  { keys: "⌘ K", labelKey: "sc.k.cmdk", groupKey: "sc.group.nav" },
  { keys: "G",   labelKey: "sc.k.g",    groupKey: "sc.group.nav" },
  { keys: "T",   labelKey: "sc.k.t",    groupKey: "sc.group.nav" },
  { keys: "O",   labelKey: "sc.k.o",    groupKey: "sc.group.nav" },
  { keys: "E",   labelKey: "sc.k.e",    groupKey: "sc.group.dock" },
  { keys: "F",   labelKey: "sc.k.f",    groupKey: "sc.group.dock" },
  { keys: "A",   labelKey: "sc.k.a",    groupKey: "sc.group.dock" },
  { keys: "L",   labelKey: "sc.k.l",    groupKey: "sc.group.dock" },
  { keys: "R",   labelKey: "sc.k.r",    groupKey: "sc.group.analysis" },
  { keys: "Shift + click", labelKey: "sc.k.shift",  groupKey: "sc.group.graph" },
  { keys: "Right-click",   labelKey: "sc.k.rclick", groupKey: "sc.group.graph" },
  { keys: "?",   labelKey: "sc.k.help", groupKey: "sc.group.help" },
  { keys: "Esc", labelKey: "sc.k.esc",  groupKey: "sc.group.help" },
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
  const { t } = useI18n();

  useEffect(() => {
    const openDockTab = (tab: "evidence" | "ai" | "alerts" | "timeline" | "trends") => {
      try { sessionStorage.setItem("sentinel.pendingDockTab", tab); } catch {}
      if (pathname !== "/workspace") {
        navigate({ to: "/workspace" }).then(() => {
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
          if (pathname !== "/workspace") navigate({ to: "/workspace" }).then(() => {
            window.dispatchEvent(new CustomEvent("sentinel:graph-fit"));
          });
          else window.dispatchEvent(new CustomEvent("sentinel:graph-fit"));
          toast(t("sc.toast.graph"));
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
          toast.success(t("sc.toast.risk"));
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

  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.groupKey)));

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-lg border-border bg-secondary text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.12em] text-primary">
            <Keyboard size={14} /> {t("sc.title")}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-muted-foreground">
            {t("sc.desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g}>
              <div className="mono mb-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t(g)}</div>
              <ul className="space-y-1">
                {SHORTCUTS.filter((s) => s.groupKey === g).map((s) => (
                  <li key={s.keys} className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="text-foreground/85">{t(s.labelKey)}</span>
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