import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Timeline } from "@/components/sentinel/Timeline";
import { TIMELINE_EVENTS } from "@/components/sentinel/data";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Investigation Timeline · Shadowless" },
      { name: "description", content: "Chronological record of every investigative action, finding, alert and decision across the active case." },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const pinned = TIMELINE_EVENTS.filter((e) => e.pinned).length;
  return (
    <AppShell>
      <PageShell
        title="Investigation Timeline"
        subtitle={`Chronological case record · ${TIMELINE_EVENTS.length} events · ${pinned} milestones`}
        actions={
          <button
            onClick={() => toast.success("Timeline export queued (JSON + PDF)")}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-[#1f2630] bg-[#0d1117] px-2.5 text-[13px] font-semibold text-[#bbcabf] hover:border-[#30363d] hover:text-[#e1e2eb]"
          >
            <Download size={13} /> Export timeline
          </button>
        }
      >
        <div className="h-full min-h-[70vh]">
          <Timeline />
        </div>
      </PageShell>
    </AppShell>
  );
}