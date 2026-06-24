import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Timeline } from "@/components/sentinel/Timeline";
import { TIMELINE_EVENTS } from "@/components/sentinel/data";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n";

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
  const t = useT();
  return (
    <AppShell>
      <PageShell
        title={t("page.timeline.title")}
        subtitle={`${t("page.timeline.sub")} · ${TIMELINE_EVENTS.length} · ${pinned}`}
        actions={
          <button
            onClick={() => toast.success(t("common.export"))}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] font-semibold text-foreground/80 hover:border-border hover:text-foreground"
          >
            <Download size={13} /> {t("common.export")}
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