import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { ENTITIES, type EntityKind } from "@/components/sentinel/data";
import { Panel, RiskBadge } from "@/components/sentinel/atoms";
import { User, Send, MessageSquare, Wallet, Phone, MapPin, Database, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<EntityKind, any> = {
  suspect: User, telegram: Send, forum: MessageSquare, wallet: Wallet, phone: Phone, location: MapPin, osint: Database,
};

export const Route = createFileRoute("/entities")({
  head: () => ({ meta: [{ title: "Entities · Shadowless" }, { name: "description", content: "All tracked entities across cases." }] }),
  component: EntitiesPage,
});

function EntitiesPage() {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const filtered = ENTITIES.filter((e) =>
    (risk === "all" || e.risk === risk) &&
    (q === "" || (e.label + " " + (e.alias ?? "")).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell>
      <PageShell title="Entities" subtitle={`${filtered.length} of ${ENTITIES.length} tracked`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5a6573]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search entity / alias…"
              className="h-8 w-64 rounded-sm border border-[#1f2630] bg-[#0d1117] pl-7 pr-2 text-[13px] text-[#e1e2eb] outline-none focus:border-[#ffb000]"
            />
          </div>
          <div className="flex items-center gap-1">
            {(["all","critical","high","medium","low"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={cn(
                  "rounded-sm px-2 py-1 text-[11px] font-bold uppercase tracking-wider",
                  risk === r ? "bg-[#2a1f00] text-[#ffc94d]" : "text-[#5a6573] hover:text-[#b8b8b8]",
                )}
              >{r}</button>
            ))}
          </div>
        </div>

        <Panel>
          <div className="divide-y divide-[#1f2630]">
            {filtered.map((e) => {
              const Icon = KIND_ICON[e.kind];
              return (
                <Link key={e.id} to="/" className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2.5 hover:bg-[#0d1117]">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0d1117] text-[#ffc94d]"><Icon size={14} /></div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-[#e1e2eb]">{e.label}</div>
                    <div className="mono truncate text-[11.5px] text-[#5a6573]">{e.alias ?? e.identifiers[0]?.value} · {e.connections} links · conf {e.confidence}%</div>
                  </div>
                  <span className="mono hidden w-12 text-right text-[13px] font-semibold text-[#e1e2eb] sm:inline">{e.riskScore}</span>
                  <div className="flex items-center gap-2"><RiskBadge risk={e.risk} /><ArrowRight size={13} className="text-[#5a6573] group-hover:text-[#ffc94d]" /></div>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-10 text-center text-[13px] text-[#5a6573]">No entities match the current filter.</div>
            )}
          </div>
        </Panel>
      </PageShell>
    </AppShell>
  );
}