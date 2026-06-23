import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Graph } from "@/components/sentinel/Graph";
import { DetailPanel } from "@/components/sentinel/DetailPanel";
import { BottomDock } from "@/components/sentinel/BottomDock";
import { AppShell } from "@/components/sentinel/AppShell";
import { useLayout } from "@/components/sentinel/useLayout";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
} from "@/components/ui/resizable";
import { Share2, FileSearch, Brain, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [selected, setSelected] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<null | "evidence" | "ai" | "alerts">(null);
  const mode = useLayout();
  const isMobile = mode === "mobile";
  const isXl = mode === "xl";

  const handleInvestigate = () => toast.success("Opening investigation timeline");

  return (
    <AppShell
      selectedId={selected}
      onInvestigate={handleInvestigate}
      mobileFooter={
        isMobile ? (
          <>
            <nav className="flex h-14 shrink-0 items-center justify-around border-t border-[#1f2630] bg-[#0b0e14]">
              <TabBarBtn icon={Share2} label="Graph" active onClick={() => {}} />
              <TabBarBtn icon={FileSearch} label="Evidence" badge="10" onClick={() => setMobilePanel("evidence")} />
              <TabBarBtn icon={Brain} label="AI" badge="14" onClick={() => setMobilePanel("ai")} />
              <TabBarBtn icon={Bell} label="Alerts" badge="3" tone="bad" onClick={() => setMobilePanel("alerts")} />
            </nav>
            <Drawer open={!!mobilePanel} onOpenChange={(v) => !v && setMobilePanel(null)}>
              <DrawerContent className="border-t border-[#1f2630] bg-[#0b0e14] text-[#e1e2eb] max-h-[80vh]">
                <div className="flex h-[70vh] flex-col">
                  <div className="flex items-center justify-between border-b border-[#1f2630] px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#bbcabf]">
                      {mobilePanel === "evidence" && "Evidence & Source Logs"}
                      {mobilePanel === "ai" && "AI Findings"}
                      {mobilePanel === "alerts" && "Recent Alerts"}
                    </span>
                    <button onClick={() => setMobilePanel(null)} className="text-[#5a6573]"><X size={14} /></button>
                  </div>
                  <div className="min-h-0 flex-1"><BottomDock embedded /></div>
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1">
        {isXl ? (
          <ResizablePanelGroup orientation="horizontal" id="sentinel.workspace" className="flex h-full w-full">
            <ResizablePanel id="work" defaultSize="74%" minSize="45%" className="flex min-w-0 p-2 sm:p-3">
              <ResizablePanelGroup orientation="vertical" id="sentinel.workspace.v" className="flex h-full w-full gap-2">
                <ResizablePanel id="graph" defaultSize="68%" minSize="35%" maxSize="88%" className="flex min-h-0">
                  <main className="relative h-full w-full overflow-hidden rounded border border-[#1f2630] bg-[#0b0e14]">
                    <Graph selectedId={selected} onSelect={setSelected} mode={mode} />
                  </main>
                </ResizablePanel>
                <ResizableHandle className="my-1 h-[3px] rounded-full bg-[#1f2630] transition-colors hover:bg-[#10b981]/70 data-[resize-handle-state=drag]:bg-[#10b981]" />
                <ResizablePanel id="dock" defaultSize="32%" minSize="12%" maxSize="65%" className="flex min-h-0">
                  <BottomDock embedded />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle className="bg-[#1f2630] transition-colors hover:bg-[#10b981]/70 data-[resize-handle-state=drag]:bg-[#10b981]" />
            <ResizablePanel id="detail" defaultSize="26%" minSize="18%" maxSize="42%" className="flex min-w-0">
              <DetailPanel selectedId={selected} variant="sheet" onClose={() => setSelected(null)} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Non-xl: keep simple stacked layout with overlay panels
          <div className="flex min-w-0 flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-3">
            <main className="relative min-h-0 flex-1 overflow-hidden rounded border border-[#1f2630] bg-[#0b0e14]">
              <Graph selectedId={selected} onSelect={setSelected} mode={mode} />
            </main>
            {!isMobile && <BottomDock />}
          </div>
        )}
      </div>

      {/* Tablet/desktop detail = right sheet */}
      {!isXl && !isMobile && (
        <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          <SheetContent side="right" className="w-[360px] border-l border-[#1f2630] bg-[#0b0e14] p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>Entity intelligence</SheetTitle>
              <SheetDescription>Selected entity details</SheetDescription>
            </SheetHeader>
            <DetailPanel selectedId={selected} variant="sheet" onClose={() => setSelected(null)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile detail = bottom drawer */}
      {isMobile && (
        <Drawer open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          <DrawerContent className="border-t border-[#1f2630] bg-[#0b0e14] text-[#e1e2eb] max-h-[88vh]">
            <div className="flex-1 overflow-hidden">
              <DetailPanel selectedId={selected} variant="sheet" onClose={() => setSelected(null)} />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </AppShell>
  );
}

function TabBarBtn({
  icon: Icon, label, active, badge, tone, onClick,
}: {
  icon: any; label: string; active?: boolean; badge?: string; tone?: "good" | "bad"; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold",
        active ? "text-[#4edea3]" : "text-[#bbcabf]",
      )}
    >
      {active && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />}
      <div className="relative">
        <Icon size={18} strokeWidth={active ? 2.25 : 1.8} />
        {badge && (
          <span className={cn(
            "absolute -right-2 -top-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold",
            tone === "bad" ? "bg-[#ff5d6c] text-[#2d1217]" : "bg-[#0f2a22] text-[#4edea3]",
          )}>{badge}</span>
        )}
      </div>
      {label}
    </button>
  );
}