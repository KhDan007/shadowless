import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { HintStrip } from "./HintStrip";
import { Onboarding } from "./Onboarding";
import { useLayout } from "./useLayout";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export function AppShell({
  children,
  selectedId = null,
  onInvestigate,
  hint,
  mobileFooter,
}: {
  children: ReactNode;
  selectedId?: string | null;
  onInvestigate?: () => void;
  hint?: ReactNode;
  mobileFooter?: ReactNode;
}) {
  const mode = useLayout();
  const isMobile = mode === "mobile";
  const isXl = mode === "xl";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const main = (
    <div className="flex min-w-0 flex-1 flex-col">
      <TopBar
        selectedId={selectedId}
        onInvestigate={onInvestigate}
        onOpenSidebar={() => setSidebarOpen(true)}
        mode={mode}
      />
      {hint ?? <HintStrip selectedId={selectedId} scanning={false} onInvestigate={onInvestigate} />}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {isMobile && mobileFooter}
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#10131a] text-[#e1e2eb]">
      {/* Sidebar — resizable on xl, fixed icon-rail on smaller, sheet on mobile */}
      {isXl ? (
        <ResizablePanelGroup orientation="horizontal" id="sentinel.shell" className="flex h-full w-full">
          <ResizablePanel id="sidebar" defaultSize="17%" minSize="13%" maxSize="26%" className="flex min-w-0">
            <Sidebar />
          </ResizablePanel>
          <ResizableHandle className="bg-[#1f2630] transition-colors hover:bg-[#10b981]/70 data-[resize-handle-state=drag]:bg-[#10b981]" />
          <ResizablePanel id="main" minSize="55%" className="flex min-w-0">
            {main}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          {!isMobile && <Sidebar collapsed />}
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="w-[260px] border-r border-[#1f2630] bg-[#0b0e14] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>Workspace navigation and active cases</SheetDescription>
                </SheetHeader>
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
          {main}
        </>
      )}
      <Onboarding />
      <Toaster theme="dark" position={isMobile ? "top-center" : "bottom-right"} />
    </div>
  );
}

/** Standard page wrapper for non-graph routes. Centers content, scrolls, with consistent padding. */
export function PageShell({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1f2630] bg-[#0b0e14] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold tracking-wide text-[#e1e2eb]">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[12.5px] text-[#8b96a3]">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4 lg:p-6">{children}</div>
    </div>
  );
}