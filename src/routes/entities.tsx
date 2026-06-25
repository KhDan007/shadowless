import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { useSentinelData } from "@/components/sentinel/store";
import type { EntityKind } from "@/components/sentinel/data";
import { Panel, RiskBadge } from "@/components/sentinel/atoms";
import { User, Send, MessageSquare, Wallet, Phone, MapPin, Database, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n";

const KIND_ICON: Record<EntityKind, any> = {
  suspect: User, telegram: Send, forum: MessageSquare, wallet: Wallet, phone: Phone, location: MapPin, osint: Database,
};

export const Route = createFileRoute("/entities")({
  head: () => ({ meta: [{ title: "Entities · Shadowless" }, { name: "description", content: "All tracked entities across cases." }] }),
  component: EntitiesPage,
});

function EntitiesPage() {
  const t = useT();
  const ENTITIES = useSentinelData((s) => s.entities);
  const isHydrating = useSentinelData((s) => s.isHydrating);
  const investigationId = useSentinelData((s) => s.investigationId);
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const filtered = ENTITIES.filter((e) =>
    (risk === "all" || e.risk === risk) &&
    (q === "" || (e.label + " " + (e.alias ?? "")).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell>
      <PageShell title={t("page.entities.title")} subtitle={t("page.entities.sub_fmt", { a: filtered.length, b: ENTITIES.length })}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search entity / alias…"
              className="h-8 w-64 rounded-sm border border-border bg-background pl-7 pr-2 text-[13px] text-foreground outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-1">
            {(["all","critical","high","medium","low"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={cn(
                  "rounded-sm px-2 py-1 text-[11px] font-bold uppercase tracking-wider",
                  risk === r ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground/80",
                )}
              >{r}</button>
            ))}
          </div>
        </div>

        <Panel>
          <div className="divide-y divide-border">
            {isHydrating && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-3.5 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
            {!isHydrating && filtered.map((e) => {
              const Icon = KIND_ICON[e.kind];
              return (
                <Link key={e.id} to="/workspace" className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2.5 hover:bg-background">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-background text-primary"><Icon size={14} /></div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-foreground">{e.label}</div>
                    <div className="mono truncate text-[11.5px] text-muted-foreground">{e.alias ?? e.identifiers[0]?.value} · {e.connections} links · conf {e.confidence}%</div>
                  </div>
                  <span className="mono hidden w-12 text-right text-[13px] font-semibold text-foreground sm:inline">{e.riskScore}</span>
                  <div className="flex items-center gap-2"><RiskBadge risk={e.risk} /><ArrowRight size={13} className="text-muted-foreground group-hover:text-primary" /></div>
                </Link>
              );
            })}
            {!isHydrating && filtered.length === 0 && (
              <div className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                {!investigationId
                  ? "Запустите сканирование, чтобы получить сущности."
                  : ENTITIES.length === 0
                    ? "Бэкенд не вернул сущностей для этого расследования."
                    : "Ничего не найдено по фильтру."}
              </div>
            )}
          </div>
        </Panel>
      </PageShell>
    </AppShell>
  );
}