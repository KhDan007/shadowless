import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { EvidenceView } from "@/components/sentinel/EvidenceView";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [{ title: "Evidence · Shadowless" }, { name: "description", content: "All evidence and source logs." }] }),
  component: EvidencePage,
});

function EvidencePage() {
  return (
    <AppShell>
      <PageShell
        title="Evidence & Source Logs"
        subtitle="Searchable evidence ledger with chain-of-custody, artifacts and entity links"
        actions={
          <button
            onClick={() => toast.success("Evidence bundle queued for export")}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[13px] font-semibold text-foreground/80 hover:border-border hover:text-foreground"
          ><Download size={13} /> Export bundle</button>
        }
      >
        <div className="flex h-full min-h-[70vh] flex-col">
          <EvidenceView />
        </div>
      </PageShell>
    </AppShell>
  );
}