import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import { useSentinelData } from "./store";
import { CASES, REPORTS } from "./data";
import { useTheme } from "./useTheme";
import { toast } from "sonner";
import {
  Share2, Users, FileSearch, Brain, FileText, Settings, LayoutGrid,
  History, Radar, Sun, Moon, Download, ShieldAlert, Hash, FileBadge,
} from "lucide-react";

/**
 * Command palette — operator console. Bound to ⌘K / Ctrl+K globally.
 * Sources: entities, evidence (LogRow), reports, cases, routes, actions.
 * Selecting an entity fires `sentinel:select-entity` (graph picks it up).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const entities = useSentinelData((s) => s.entities);
  const logRows = useSentinelData((s) => s.logRows);
  const beginScan = useSentinelData((s) => s.beginScan);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    const opener = () => setOpen(true);
    window.addEventListener("sentinel:open-command", opener as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("sentinel:open-command", opener as EventListener);
    };
  }, []);

  const run = (fn: () => void) => () => { setOpen(false); fn(); };

  const selectEntity = (id: string, label: string) => run(() => {
    window.dispatchEvent(new CustomEvent("sentinel:select-entity", { detail: id }));
    navigate({ to: "/" });
    toast(`Focused ${label}`, { description: id });
  });

  const recentEvidence = useMemo(() => logRows.slice(0, 8), [logRows]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type to search — entities, evidence IDs, cases, actions…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No matches in this case file.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={run(() => { beginScan(); toast.success("Scan initiated"); })}>
            <Radar size={14} /> <span>Run new scan</span>
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={run(() => {
            const r = REPORTS[0];
            if (r) navigate({ to: "/dossier/$id", params: { id: r.id } });
          })}>
            <FileBadge size={14} /> <span>Open dossier export view</span>
          </CommandItem>
          <CommandItem onSelect={run(() => { toggleTheme(); toast(`Theme · ${theme === "dark" ? "light" : "dark"}`); })}>
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span>Toggle theme · {theme === "dark" ? "light" : "dark"}</span>
            <CommandShortcut>⇧T</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <NavItem icon={LayoutGrid} label="Overview" to="/overview" onRun={run} navigate={navigate} />
          <NavItem icon={Share2}     label="Graph"    to="/workspace"         onRun={run} navigate={navigate} />
          <NavItem icon={Users}      label="Entities" to="/entities" onRun={run} navigate={navigate} />
          <NavItem icon={FileSearch} label="Evidence" to="/evidence" onRun={run} navigate={navigate} />
          <NavItem icon={History}    label="Timeline" to="/timeline" onRun={run} navigate={navigate} />
          <NavItem icon={Brain}      label="AI Analysis" to="/ai"    onRun={run} navigate={navigate} />
          <NavItem icon={FileText}   label="Reports"  to="/reports"  onRun={run} navigate={navigate} />
          <NavItem icon={Settings}   label="Settings" to="/settings" onRun={run} navigate={navigate} />
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={`Entities · ${entities.length}`}>
          {entities.map((e) => (
            <CommandItem
              key={e.id}
              value={`${e.label} ${e.alias ?? ""} ${e.kind} ${e.id}`}
              onSelect={selectEntity(e.id, e.label)}
            >
              <ShieldAlert
                size={14}
                className={
                  e.risk === "critical" ? "text-destructive" :
                  e.risk === "high"     ? "text-[color:var(--risk-high)]" :
                  e.risk === "medium"   ? "text-[color:var(--risk-medium)]" :
                                          "text-primary"
                }
              />
              <span className="truncate">{e.label}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {e.kind} · risk {e.riskScore}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent evidence">
          {recentEvidence.map((row) => (
            <CommandItem
              key={row.id}
              value={`${row.id} ${row.entity} ${row.finding} ${row.source}`}
              onSelect={run(() => {
                navigate({ to: "/evidence" });
                toast(row.id, { description: row.finding });
              })}
            >
              <Hash size={14} className="text-muted-foreground" />
              <span className="truncate">{row.finding}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{row.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Cases">
          {CASES.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.id} ${c.title}`}
              onSelect={run(() => { navigate({ to: "/overview" }); toast(`Case #${c.id}`, { description: c.title }); })}
            >
              <FileText size={14} /> <span className="truncate">{c.title}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">#{c.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Reports">
          {REPORTS.slice(0, 6).map((r) => (
            <CommandItem
              key={r.id}
              value={`${r.id} ${r.title}`}
              onSelect={run(() => navigate({ to: "/reports/$id", params: { id: r.id } }))}
            >
              <Download size={14} className="text-muted-foreground" />
              <span className="truncate">{r.title}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{r.id}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function NavItem({
  icon: Icon, label, to, onRun, navigate,
}: {
  icon: any; label: string; to: string;
  onRun: (fn: () => void) => () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <CommandItem onSelect={onRun(() => navigate({ to: to as any }))}>
      <Icon size={14} /> <span>{label}</span>
      <CommandShortcut>{to}</CommandShortcut>
    </CommandItem>
  );
}