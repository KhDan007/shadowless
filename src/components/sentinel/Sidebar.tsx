import { useState } from "react";
import {
  LayoutGrid, Share2, Users, FileSearch, Brain, FileText, Settings,
  ShieldCheck, Cpu, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CASES } from "./data";
import { RiskBadge } from "./atoms";

const NAV = [
  { id: "overview", icon: LayoutGrid, label: "Overview" },
  { id: "graph", icon: Share2, label: "Graph" },
  { id: "entities", icon: Users, label: "Entities" },
  { id: "evidence", icon: FileSearch, label: "Evidence" },
  { id: "ai", icon: Brain, label: "AI Analysis" },
  { id: "reports", icon: FileText, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const [active, setActive] = useState("graph");
  const [activeCase, setActiveCase] = useState("KZ-2048");

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[#1f2630] bg-[#0b0e14]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-[#1f2630] px-4 py-3.5">
        <div className="relative flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#10b981] to-[#047857]">
          <ShieldCheck size={16} className="text-[#00251a]" strokeWidth={2.5} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#4edea3] ring-2 ring-[#0b0e14]" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-bold tracking-wide text-[#e1e2eb]">STATE SENTINEL</span>
          <span className="mono text-[9px] tracking-[0.15em] text-[#5a6573]">MIA · KZ · CIB-04</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2 py-3">
        <div className="px-2 pb-1.5 text-[10px] font-bold tracking-[0.14em] text-[#5a6573]">WORKSPACE</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors",
                isActive
                  ? "bg-[#0f2a22] text-[#4edea3]"
                  : "text-[#bbcabf] hover:bg-[#161b22] hover:text-[#e1e2eb]",
              )}
            >
              {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[#10b981] shadow-[0_0_8px_#10b981]" />}
              <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Cases */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <div className="flex items-center justify-between px-2 pb-1.5 pt-3">
          <span className="text-[10px] font-bold tracking-[0.14em] text-[#5a6573]">ACTIVE CASES</span>
          <span className="mono text-[10px] text-[#5a6573]">{CASES.length}</span>
        </div>
        <div className="space-y-1">
          {CASES.map((c) => {
            const isActive = c.id === activeCase;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCase(c.id)}
                className={cn(
                  "group block w-full rounded-sm border px-2.5 py-2 text-left transition-colors",
                  isActive
                    ? "border-[#10b981]/40 bg-[#0f2a22]/40"
                    : "border-transparent hover:border-[#1f2630] hover:bg-[#161b22]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="mono text-[11px] font-semibold text-[#e1e2eb]">#{c.id}</span>
                  <RiskBadge risk={c.risk} />
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-[#bbcabf]">{c.title}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-[#5a6573]">
                  <span className="mono">{c.entities} entities</span>
                  <span>·</span>
                  <span>updated 14:22</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="border-t border-[#1f2630] px-3 py-2.5 space-y-1.5">
        <StatusLine icon={<ShieldCheck size={12} />} label="System Ready" tone="good" />
        <StatusLine icon={<Cpu size={12} />} label="AI Engine Online" tone="good" />
        <StatusLine icon={<Lock size={12} />} label="Secure Session · TLS 1.3" tone="good" />
      </div>
    </aside>
  );
}

function StatusLine({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "good" | "warn" }) {
  const color = tone === "good" ? "text-[#4edea3]" : "text-[#f5b850]";
  return (
    <div className="flex items-center gap-2 text-[11px] text-[#bbcabf]">
      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", color)}>{icon}</span>
      <span className="font-medium">{label}</span>
      <span className={cn("ml-auto h-1.5 w-1.5 rounded-full", tone === "good" ? "bg-[#4edea3]" : "bg-[#f5b850]")} />
    </div>
  );
}