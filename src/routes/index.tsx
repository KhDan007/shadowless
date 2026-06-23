import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sentinel/Sidebar";
import { TopBar } from "@/components/sentinel/TopBar";
import { Graph } from "@/components/sentinel/Graph";
import { DetailPanel } from "@/components/sentinel/DetailPanel";
import {
  EvidenceTable, AIFindings, ConfidenceChart, RecentAlerts,
} from "@/components/sentinel/BottomPanels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "State Sentinel · Case #KZ-2048" },
      { name: "description", content: "Kazakhstan MIA digital investigation dashboard — graph intelligence, entity timelines, and AI-detected relationships." },
      { property: "og:title", content: "State Sentinel · Case #KZ-2048" },
      { property: "og:description", content: "Operational OSINT and digital evidence dashboard for cyber investigators." },
    ],
  }),
  component: Index,
});

function Index() {
  const [selected, setSelected] = useState<string | null>("e-alpha");
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#10131a] text-[#e1e2eb]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          {/* Main workspace */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
            <main className="relative min-h-0 flex-1 overflow-hidden rounded border border-[#1f2630] bg-[#0b0e14]">
              <Graph selectedId={selected} onSelect={setSelected} />
            </main>
            <section className="grid h-[290px] shrink-0 grid-cols-12 gap-3">
              <div className="col-span-12 xl:col-span-7 flex min-h-0">
                <EvidenceTable />
              </div>
              <div className="col-span-12 xl:col-span-3 flex min-h-0">
                <AIFindings />
              </div>
              <div className="col-span-12 xl:col-span-2 flex min-h-0 flex-col gap-3">
                <ConfidenceChart />
                <RecentAlerts />
              </div>
            </section>
          </div>
          <DetailPanel selectedId={selected} />
        </div>
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
