import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sentinel/Sidebar";
import { TopBar } from "@/components/sentinel/TopBar";
import { Graph } from "@/components/sentinel/Graph";
import { DetailPanel } from "@/components/sentinel/DetailPanel";
import { BottomDock } from "@/components/sentinel/BottomDock";
import { HintStrip } from "@/components/sentinel/HintStrip";
import { Onboarding } from "@/components/sentinel/Onboarding";
import { useLayout } from "@/components/sentinel/useLayout";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<null | "evidence" | "ai" | "alerts">(null);
  const mode = useLayout();
  const isMobile = mode === "mobile";
  const isTablet = mode === "tablet";
  const isDesktop = mode === "desktop";
  const isXl = mode === "xl";

  const handleInvestigate = () => toast.success("Opening investigation timeline");
  const handleSelect = (id: string) => {
    setSelected(id);
    // On mobile/tablet, opening the detail sheet on selection
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#10131a] text-[#e1e2eb]">
      {/* Sidebar — full on xl, icon-rail on desktop/tablet, sheet on mobile */}
      {isXl && <Sidebar />}
      {(isDesktop || isTablet) && <Sidebar collapsed />}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[260px] border-r border-[#1f2630] bg-[#0b0e14] p-0">
            <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          selectedId={selected}
          onInvestigate={handleInvestigate}
          onOpenSidebar={() => setSidebarOpen(true)}
          mode={mode}
        />
        <HintStrip selectedId={selected} scanning={false} onInvestigate={handleInvestigate} />

        <div className="flex min-h-0 flex-1">
          {/* Main workspace */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-3">
            <main className="relative min-h-0 flex-1 overflow-hidden rounded border border-[#1f2630] bg-[#0b0e14]">
              <Graph selectedId={selected} onSelect={handleSelect} mode={mode} />
            </main>
            {/* Bottom dock — desktop/xl only; mobile uses bottom tab bar */}
            {!isMobile && <BottomDock />}
          </div>

          {/* Detail panel — pinned on xl, slide-over below */}
          {isXl && <DetailPanel selectedId={selected} />}
        </div>

        {/* Tablet/desktop detail panel = right sheet */}
        {(isDesktop || isTablet) && (
          <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
            <SheetContent side="right" className="w-[360px] border-l border-[#1f2630] bg-[#0b0e14] p-0 sm:max-w-md">
              <SheetHeader className="sr-only"><SheetTitle>Entity intelligence</SheetTitle></SheetHeader>
              <DetailPanel selectedId={selected} variant="sheet" onClose={() => setSelected(null)} />
            </SheetContent>
          </Sheet>
        )}

        {/* Mobile: detail panel = bottom drawer */}
        {isMobile && (
          <Drawer open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
            <DrawerContent className="border-t border-[#1f2630] bg-[#0b0e14] text-[#e1e2eb] max-h-[88vh]">
              <div className="flex-1 overflow-hidden">
                <DetailPanel selectedId={selected} variant="sheet" onClose={() => setSelected(null)} />
              </div>
            </DrawerContent>
          </Drawer>
        )}

        {/* Mobile: dock as bottom tab bar that opens a drawer */}
        {isMobile && (
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
        )}
      </div>
      <Onboarding />
      <Toaster theme="dark" position={isMobile ? "top-center" : "bottom-right"} />
    </div>
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
