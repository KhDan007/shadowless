import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { Share2, FileSearch, Brain, Bell, X, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Shadowless · Case #KZ-2048" },
      { name: "description", content: "Shadowless — Kazakhstan MIA digital investigation dashboard with graph intelligence, entity timelines, and AI-detected relationships." },
      { property: "og:title", content: "Shadowless · Case #KZ-2048" },
      { property: "og:description", content: "Operational OSINT and digital evidence dashboard for cyber investigators." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<null | "evidence" | "ai" | "alerts">(null);
  const [detailOpen, setDetailOpen] = useState(true);
  const mode = useLayout();
  const isMobile = mode === "mobile";
  const isXl = mode === "xl";
  const navigate = useNavigate();

  const handleInvestigate = () => navigate({ to: "/timeline" });

  // Allow alerts panel (or other surfaces) to focus an entity in the graph
  // without coupling those components to this route.
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id === "string") setSelected(id);
    };
    window.addEventListener("sentinel:select-entity", handler as EventListener);
    return () => window.removeEventListener("sentinel:select-entity", handler as EventListener);
  }, []);

  // Pick up a pending entity selection requested before this route mounted.
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("sentinel.pendingSelectEntity");
      if (pending) {
        setSelected(pending);
        sessionStorage.removeItem("sentinel.pendingSelectEntity");
      }
    } catch {}
  }, []);

  // Auto-open the detail rail when a new entity is selected.
  useEffect(() => {
    if (selected) setDetailOpen(true);
  }, [selected]);

  return (
    <AppShell
      selectedId={selected}
      onInvestigate={handleInvestigate}
      mobileFooter={
        isMobile ? (
          <>
            <nav className="flex h-14 shrink-0 items-center justify-around border-t border-border bg-card">
              <TabBarBtn icon={Share2} label={t("mob.tab.graph")} active onClick={() => {}} />
              <TabBarBtn icon={FileSearch} label={t("mob.tab.evidence")} badge="10" onClick={() => setMobilePanel("evidence")} />
              <TabBarBtn icon={Brain} label={t("mob.tab.ai")} badge="14" onClick={() => setMobilePanel("ai")} />
              <TabBarBtn icon={Bell} label={t("mob.tab.alerts")} badge="3" tone="bad" onClick={() => setMobilePanel("alerts")} />
            </nav>
            <Drawer open={!!mobilePanel} onOpenChange={(v) => !v && setMobilePanel(null)}>
              <DrawerContent className="border-t border-border bg-card text-foreground max-h-[80vh]">
                <div className="flex h-[70vh] flex-col">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-foreground/80">
                      {mobilePanel === "evidence" && t("sheet.evidence")}
                      {mobilePanel === "ai" && t("sheet.ai")}
                      {mobilePanel === "alerts" && t("sheet.alerts")}
                    </span>
                    <button onClick={() => setMobilePanel(null)} className="text-muted-foreground"><X size={14} /></button>
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
          <ResizablePanelGroup
            key={selected && detailOpen ? "with-detail" : "no-detail"}
            orientation="horizontal"
            id="sentinel.workspace"
            className="flex h-full w-full"
          >
            <ResizablePanel id="work" defaultSize={detailOpen && selected ? "74%" : "100%"} minSize="45%" className="relative flex min-w-0 p-2 sm:p-3">
              <ResizablePanelGroup orientation="vertical" id="sentinel.workspace.v" className="flex h-full w-full gap-2">
                <ResizablePanel id="graph" defaultSize="68%" minSize="35%" maxSize="88%" className="flex min-h-0">
                  <main className="relative h-full w-full overflow-hidden rounded border border-border bg-card">
                    <Graph selectedId={selected} onSelect={setSelected} mode={mode} />
                  </main>
                </ResizablePanel>
                <ResizableHandle className="my-1 h-[3px] rounded-full bg-muted transition-colors hover:bg-primary/70 data-[resize-handle-state=drag]:bg-primary" />
                <ResizablePanel id="dock" defaultSize="32%" minSize="12%" maxSize="65%" className="flex min-h-0">
                  <BottomDock embedded />
                </ResizablePanel>
              </ResizablePanelGroup>
              {selected && !detailOpen && (
                <button
                  onClick={() => setDetailOpen(true)}
                  title={t("sheet.details_btn.title")}
                  className="absolute right-4 top-4 z-10 inline-flex h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-[12.5px] font-semibold text-foreground/80 shadow hover:border-primary hover:text-primary"
                >
                  <PanelRightOpen size={14} /> {t("sheet.details_btn")}
                </button>
              )}
            </ResizablePanel>
            {selected && detailOpen && (
              <>
                <ResizableHandle className="bg-muted transition-colors hover:bg-primary/70 data-[resize-handle-state=drag]:bg-primary" />
                <ResizablePanel id="detail" defaultSize="26%" minSize="18%" maxSize="42%" className="flex min-w-0">
                  <DetailPanel selectedId={selected} variant="sheet" onClose={() => setDetailOpen(false)} />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        ) : (
          // Non-xl: resizable vertical stack (graph / dock) on tablet+, plain stack on mobile
          <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-3">
            {isMobile ? (
              <main className="relative min-h-0 flex-1 overflow-hidden rounded border border-border bg-card">
                <Graph selectedId={selected} onSelect={setSelected} mode={mode} />
              </main>
            ) : (
              <ResizablePanelGroup orientation="vertical" id="sentinel.nonxl.v" className="flex h-full w-full gap-2">
                <ResizablePanel id="graph" defaultSize="64%" minSize="30%" maxSize="88%" className="flex min-h-0">
                  <main className="relative h-full w-full overflow-hidden rounded border border-border bg-card">
                    <Graph selectedId={selected} onSelect={setSelected} mode={mode} />
                  </main>
                </ResizablePanel>
                <ResizableHandle className="my-1 h-[3px] rounded-full bg-muted transition-colors hover:bg-primary/70 data-[resize-handle-state=drag]:bg-primary" />
                <ResizablePanel id="dock" defaultSize="36%" minSize="12%" maxSize="65%" className="flex min-h-0">
                  <BottomDock embedded />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>
        )}
      </div>

      {/* Tablet/desktop detail = right sheet */}
      {!isXl && !isMobile && (
        <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          <SheetContent side="right" className="w-[360px] border-l border-border bg-card p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>{t("sheet.entity.title")}</SheetTitle>
              <SheetDescription>{t("sheet.entity.desc")}</SheetDescription>
            </SheetHeader>
            <DetailPanel selectedId={selected} variant="sheet" onClose={() => setSelected(null)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile detail = bottom drawer */}
      {isMobile && (
        <Drawer open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          <DrawerContent className="border-t border-border bg-card text-foreground max-h-[88vh]">
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
        "relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
        active ? "text-primary" : "text-foreground/80",
      )}
    >
      {active && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary " />}
      <div className="relative">
        <Icon size={18} strokeWidth={active ? 2.25 : 1.8} />
        {badge && (
          <span className={cn(
            "absolute -right-2 -top-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
            tone === "bad" ? "bg-destructive text-destructive-foreground" : "bg-primary/15 text-primary",
          )}>{badge}</span>
        )}
      </div>
      {label}
    </button>
  );
}