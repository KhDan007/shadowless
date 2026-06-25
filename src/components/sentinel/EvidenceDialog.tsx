import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, ExternalLink, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchEvidence, type EvidenceDetailResponse } from "@/lib/sentinelApi";
import { useI18n } from "@/i18n";

export function EvidenceDialog({
  evidenceId,
  open,
  onOpenChange,
  fallback,
}: {
  evidenceId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fallback?: { title?: string; time?: string } | null;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<EvidenceDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !evidenceId) return;
    let cancelled = false;
    setLoading(true); setError(null); setData(null);
    fetchEvidence(evidenceId)
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, evidenceId]);

  const copy = (txt: string) => {
    navigator.clipboard?.writeText(txt).then(
      () => toast.success(t("bp.ev.copied")),
      () => toast.error("clipboard error"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card p-0">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="mono text-[12px] font-bold uppercase tracking-[0.14em] text-foreground">
            {t("evidence.modal.title")} · <span className="text-muted-foreground">{evidenceId || "—"}</span>
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            {t("evidence.modal.desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 size={14} className="animate-spin text-primary" /> {t("evidence.modal.loading")}
            </div>
          )}
          {error && !loading && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-sm border border-border bg-background p-2 text-[12px] text-muted-foreground">
                <AlertTriangle size={12} className="mt-0.5 text-[color:var(--risk-medium)]" />
                <span>{error.includes("404") ? t("evidence.modal.notfound") : error}</span>
              </div>
              {fallback && (fallback.title || fallback.time) && (
                <div className="space-y-2">
                  {fallback.title && <p className="text-[13px] leading-snug text-foreground">{fallback.title}</p>}
                  {fallback.time && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                      <span className="text-muted-foreground">{t("evidence.modal.time")}</span>
                      <span className="mono text-foreground">{fallback.time}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {data && !loading && (
            <div className="space-y-4">
              <p className="text-[13px] leading-snug text-foreground">{data.snippet}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                <span className="text-muted-foreground">{t("evidence.modal.source")}</span>
                <span className="mono truncate text-foreground">{data.source ?? "—"}</span>
                <span className="text-muted-foreground">{t("evidence.modal.time")}</span>
                <span className="mono text-foreground">{data.time ?? "—"}</span>
                <span className="text-muted-foreground">{t("evidence.modal.confidence")}</span>
                <span className="mono text-foreground">{data.confidence != null ? `${Math.round(data.confidence)}` : "—"}</span>
              </div>
              {data.source_url && (
                <a
                  href={data.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mono inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                >
                  <ExternalLink size={11} /> {data.source_url}
                </a>
              )}
              {Array.isArray(data.custody_steps) && data.custody_steps.length > 0 && (
                <details className="rounded-sm border border-border bg-background p-2">
                  <summary className="mono cursor-pointer text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {t("evidence.modal.custody")} · {data.custody_steps.length}
                  </summary>
                  <pre className="mono mt-2 max-h-48 overflow-auto text-[11px] leading-snug text-foreground/80">
                    {JSON.stringify(data.custody_steps, null, 2)}
                  </pre>
                </details>
              )}
              {Array.isArray(data.artifacts) && data.artifacts.length > 0 && (
                <details className="rounded-sm border border-border bg-background p-2">
                  <summary className="mono cursor-pointer text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {t("evidence.modal.artifacts")} · {data.artifacts.length}
                  </summary>
                  <pre className="mono mt-2 max-h-48 overflow-auto text-[11px] leading-snug text-foreground/80">
                    {JSON.stringify(data.artifacts, null, 2)}
                  </pre>
                </details>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => copy(data.id)}
                  className="mono inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Copy size={10} /> {t("evidence.modal.copy_id")}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}