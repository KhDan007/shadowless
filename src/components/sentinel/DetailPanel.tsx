import { motion, AnimatePresence } from "framer-motion";
import {
  Pin, ChevronRight, ShieldAlert, Activity, ArrowRight, X, ChevronDown,
  Sparkles, Loader2, AlertTriangle,
} from "lucide-react";
import { useSentinelData } from "./store";
import { MonoKV, RiskBadge, StatusChip, riskMeta } from "./atoms";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { fetchDossier } from "@/lib/sentinelApi";
import { useI18n } from "@/i18n";

export function DetailPanel({
  selectedId,
  onClose,
  variant = "rail",
}: {
  selectedId: string | null;
  onClose?: () => void;
  variant?: "rail" | "sheet";
}) {
  const { t } = useI18n();
  // Empty state: only the rail variant shows it (sheet/drawer always open with a selection).
  if (!selectedId && variant === "rail") {
    return (
      <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("detail.title")}</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border text-primary">
            <MousePointerClick size={20} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-foreground">{t("detail.empty.head")}</div>
            <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
              {t("detail.empty.body")}
            </p>
          </div>
          <div className="mono mt-1 text-[11px] text-muted-foreground">
            {t("detail.empty.tip")}<span className="text-destructive">Объект Альфа</span>
          </div>
        </div>
      </aside>
    );
  }

  const entities = useSentinelData((s) => s.entities);
  const entity = entities.find((e) => e.id === selectedId) ?? entities[0];
  if (!entity) return null;
  const isLive = useSentinelData((s) => s.isLive);
  const investigationId = useSentinelData((s) => s.investigationId);
  const dossier = useSentinelData((s) => s.dossier);
  const beginDossier = useSentinelData((s) => s.beginDossier);
  const setDossier = useSentinelData((s) => s.setDossier);
  const failDossier = useSentinelData((s) => s.failDossier);
  const clearDossier = useSentinelData((s) => s.clearDossier);
  const [score, setScore] = useState(0);
  const [aiText, setAiText] = useState("");
  const [recomputeNonce, setRecomputeNonce] = useState(0);
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const navigate = useNavigate();
  const goTimeline = () => navigate({ to: "/timeline" });

  useEffect(() => {
    setScore(0); setAiText("");
    const s = setInterval(() => setScore((v) => (v >= entity.riskScore ? entity.riskScore : v + 3)), 25);
    let i = 0;
    const t = setInterval(() => {
      if (i >= entity.summary.length) { clearInterval(t); return; }
      i += 2;
      setAiText(entity.summary.slice(0, i));
    }, 14);
    return () => { clearInterval(s); clearInterval(t); };
  }, [entity.id, entity.riskScore, entity.summary, recomputeNonce]);

  // Re-run the score animation when the user triggers a global recompute (R).
  useEffect(() => {
    const onRecompute = () => setRecomputeNonce((n) => n + 1);
    window.addEventListener("sentinel:risk-recompute", onRecompute);
    return () => window.removeEventListener("sentinel:risk-recompute", onRecompute);
  }, []);

  // Clear any previous dossier when switching entity.
  useEffect(() => {
    if (dossier.nodeId && dossier.nodeId !== entity.id) clearDossier();
  }, [entity.id, dossier.nodeId, clearDossier]);

  const canDossier = isLive && !!investigationId;
  const dossierActive = dossier.nodeId === entity.id;
  const dossierData = dossierActive ? dossier.data : null;
  const dossierError = dossierActive ? dossier.error : null;
  const dossierLoading = dossierActive && dossier.loading;

  const runDossier = async () => {
    if (!canDossier || !investigationId || dossierLoading) return;
    beginDossier(entity.id);
    try {
      const res = await fetchDossier(investigationId, entity.id);
      setDossier(res.card);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failDossier(msg);
      toast.error(`${t("detail.dossier.toast_fail")} ${msg}`);
    }
  };

  // Listen for "Open in dossier" requests from the graph context menu.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id !== entity.id) return;
      const el = document.getElementById("entity-dossier-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (canDossier && !dossierLoading && !dossierData) {
        void runDossier();
      }
    };
    window.addEventListener("sentinel:open-dossier", onOpen as EventListener);
    return () => window.removeEventListener("sentinel:open-dossier", onOpen as EventListener);
  });

  const r = riskMeta[entity.risk];

  return (
    <aside className={cn(
      "flex h-full flex-col bg-card",
      variant === "rail" ? "w-[320px] shrink-0 border-l border-border" : "w-full",
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={entity.id}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 14 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex h-full flex-col"
        >
          {/* Header: identity + ONE primary CTA */}
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("detail.title")}</span>
              <RiskBadge risk={entity.risk} className="ml-auto" />
              {onClose && (
                <button onClick={onClose} className="ml-1 text-muted-foreground hover:text-foreground" aria-label={t("common.close")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-bold leading-tight text-foreground">{entity.label}</h2>
                {entity.alias && <div className="mono text-[12px] text-muted-foreground">{entity.alias}</div>}
              </div>
              <button
                onClick={() => toast.success(t("detail.pinned_toast"))}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-border hover:text-primary"
                title={t("detail.pin")}
              >
                <Pin size={13} />
              </button>
            </div>
            <button
              onClick={goTimeline}
              className={cn(
                "mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-primary text-[13px] font-bold tracking-wide text-primary-foreground hover:bg-primary",
                "signal-glow",
              )}
            >
              <ShieldAlert size={13} /> {t("detail.cta.investigate")} <ArrowRight size={13} />
            </button>
          </div>

          {/* Score strip: etched 0–100 ramp + signal-log breakdown */}
          <section className="border-b border-border px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80">{t("detail.risk_score")}</span>
              <div className="flex items-baseline gap-1">
                <span className={cn("mono text-[26px] font-bold leading-none tabular-nums", r.text)}>{score}</span>
                <span className="text-[11px] text-muted-foreground">/100</span>
              </div>
            </div>
            {/* Etched ramp */}
            <div className="mt-2 relative">
              <div className="h-1.5 w-full overflow-hidden rounded-none border border-border bg-background">
                <div
                  className={cn(
                    "h-full transition-all duration-700",
                    entity.risk === "critical" && "bg-destructive",
                    entity.risk === "high"     && "bg-[color:var(--risk-high)]",
                    entity.risk === "medium"   && "bg-[color:var(--risk-medium)]",
                    entity.risk === "low"      && "bg-primary",
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>
              {/* Tick marks: 0 / 25 / 50 / 75 / 100 */}
              <div className="relative mt-0.5 h-2">
                {[0, 25, 50, 75, 100].map((t) => (
                  <span
                    key={t}
                    className="absolute top-0 h-1 w-px bg-muted-foreground/50"
                    style={{ left: `${t}%`, transform: t === 100 ? "translateX(-1px)" : undefined }}
                  />
                ))}
              </div>
              <div className="mono mt-0 flex justify-between text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <Metric label={t("detail.metric.confidence")} value={`${entity.confidence}%`} />
              <Metric label={t("detail.metric.connections")} value={String(entity.connections)} />
              <Metric label={t("detail.metric.reliability")} value={entity.reliability} />
            </div>

            {/* Contributing signals — analyst's notebook */}
            {entity.riskFactors && entity.riskFactors.length > 0 && (
              <div className="mt-3 border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() => setSignalsOpen((v) => !v)}
                  className="flex w-full items-baseline justify-between gap-2 text-left hover:text-foreground"
                  aria-expanded={signalsOpen}
                >
                  <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <ChevronDown
                      size={11}
                      className={cn("transition-transform", signalsOpen ? "" : "-rotate-90")}
                    />
                    {t("detail.signals.title")}
                    <span className="mono ml-1 rounded-sm bg-secondary px-1 text-[10px] text-foreground/70">
                      {entity.riskFactors.length}
                    </span>
                  </span>
                  <span className="mono text-[10px] text-muted-foreground">
                    Σ {entity.riskFactors.reduce((a, f) => a + f.delta, 0)}
                  </span>
                </button>
                {signalsOpen && (
                  <ul className="mt-1 space-y-1">
                    {entity.riskFactors.map((f, i) => (
                      <li
                        key={i}
                        className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 border-b border-border/50 py-0.5 last:border-0"
                        title={`${f.source} · ${f.time}`}
                      >
                        <span className="mono text-[10.5px] text-primary">+{f.delta.toString().padStart(2, "0")}</span>
                        <span className="truncate text-[11.5px] text-foreground/85">{f.label}</span>
                        <span className="mono text-[10px] text-muted-foreground">{f.time}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* AI Dossier — live only */}
          <section className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                <Sparkles size={10} /> {t("detail.dossier.label")}
              </span>
              {dossierData && (
                <span className="mono ml-auto text-[10px] text-muted-foreground">{t("detail.dossier.synth_ok")}</span>
              )}
            </div>

            {!canDossier && (
              <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                {t("detail.dossier.need_live")}
              </p>
            )}

            {canDossier && !dossierData && !dossierLoading && !dossierError && (
              <button
                onClick={runDossier}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 text-[12.5px] font-bold tracking-wide text-primary hover:bg-primary/20"
              >
                <Sparkles size={12} /> {t("detail.dossier.cta")}
              </button>
            )}

            {dossierLoading && (
              <div className="mt-2 flex items-center gap-2 rounded-sm border border-border bg-background px-2 py-2 text-[12px] text-foreground/80">
                <Loader2 size={13} className="animate-spin text-primary" />
                <span>{t("detail.dossier.loading")}</span>
              </div>
            )}

            {dossierError && !dossierLoading && (
              <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-destructive/40 bg-destructive/15 p-2 text-[11.5px] text-destructive">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                <div className="flex-1 break-words">
                  <div className="font-bold uppercase tracking-wider">{t("detail.dossier.error")}</div>
                  <div className="mt-0.5 text-destructive/90">{dossierError}</div>
                  <button
                    onClick={runDossier}
                    className="mono mt-1 text-[11px] underline hover:text-destructive"
                  >
                    {t("detail.dossier.retry")}
                  </button>
                </div>
              </div>
            )}

            {dossierData && (
              <div className="mt-2 space-y-2.5">
                <p className="text-[13px] font-medium leading-[1.5] text-foreground">
                  {dossierData.summary}
                </p>
                <DossierList label={t("detail.dossier.sec.products")} items={dossierData.products} />
                <DossierList label={t("detail.dossier.sec.sales")} items={dossierData.sale_points} />
                <DossierList label={t("detail.dossier.sec.suppliers")} items={dossierData.suppliers} />
                <DossierList label={t("detail.dossier.sec.contacts")} items={dossierData.contacts} mono />
                <DossierList label={t("detail.dossier.sec.wallets")} items={dossierData.wallets} mono />
                {dossierData.risk_rationale && (
                  <div className="rounded-sm border border-border bg-background p-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {t("detail.dossier.sec.rationale")}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-snug text-foreground/85">
                      {dossierData.risk_rationale}
                    </p>
                  </div>
                )}
                <button
                  onClick={runDossier}
                  className="mono text-[11px] text-muted-foreground underline hover:text-foreground"
                >
                  {t("detail.dossier.resynth")}
                </button>
              </div>
            )}
          </section>

          {/* Tabbed body */}
          <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="grid h-9 w-full grid-cols-2 rounded-none border-b border-border bg-card p-0 px-2">
              {[
                { v: "summary", label: t("detail.tab.summary"), count: null as number | null },
                { v: "identifiers", label: t("detail.tab.ids"), count: entity.identifiers.length },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.v}
                  value={tab.v}
                  className="relative h-9 min-w-0 rounded-none border-0 bg-transparent px-2 text-[12.5px] font-semibold text-foreground/80 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="mono ml-1 rounded-sm bg-secondary px-1 text-[10px] text-foreground/70">{tab.count}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="summary" className="m-0 flex-1 overflow-y-auto px-4 py-3 data-[state=inactive]:hidden">
              <div className="flex items-center gap-1.5">
                <StatusChip tone="good">{t("detail.live")}</StatusChip>
                <span className="mono text-[11px] text-muted-foreground">sentinel-graph-v2.4</span>
              </div>
              <p className="mt-2 min-h-[68px] text-[13px] leading-[1.55] text-foreground/80">
                {aiText}
                <span className="ml-0.5 inline-block h-3 w-[2px] -mb-0.5 align-middle bg-primary animate-pulse" />
              </p>
              <div className="mt-3 rounded-sm border border-border bg-background p-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                  <div className="text-muted-foreground">{t("detail.source")}</div><div className="truncate text-foreground">{entity.source}</div>
                  <div className="text-muted-foreground">{t("detail.reliability")}</div><div className="text-foreground">{entity.reliability} · {t("detail.reliability.vetted")}</div>
                  <div className="text-muted-foreground">{t("detail.last_seen")}</div><div className="mono text-foreground">{entity.lastSeen}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="identifiers" className="m-0 flex-1 overflow-y-auto px-4 py-2 data-[state=inactive]:hidden">
              {entity.identifiers.map((id) => <MonoKV key={id.label} k={id.label} v={id.value} />)}
            </TabsContent>
          </Tabs>

          <section className="shrink-0 border-t border-border bg-card">
            <button
              type="button"
              onClick={() => setEvidenceOpen((v) => !v)}
              className="flex h-10 w-full items-center gap-2 px-4 text-left text-[12.5px] font-bold text-foreground/85 hover:bg-background hover:text-foreground"
              aria-expanded={evidenceOpen}
            >
              <Activity size={13} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{t("detail.evidence")}</span>
              <span className="mono rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] text-foreground/70">
                {entity.evidence.length}
              </span>
              <ChevronDown size={13} className={cn("shrink-0 transition-transform", evidenceOpen ? "" : "-rotate-90")} />
            </button>
            {evidenceOpen && (
              <div className="max-h-[180px] overflow-y-auto border-t border-border">
                {entity.evidence.length ? entity.evidence.map((ev) => {
                  const evidenceId = ev.id.toUpperCase();
                  return (
                    <Link
                      key={ev.id}
                      to="/evidence"
                      search={{ evidence: evidenceId }}
                      className="group flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-background"
                    >
                      <Activity size={12} className="shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-foreground">{ev.title}</div>
                        <div className="mono text-[11px] text-muted-foreground">{evidenceId} · {ev.time}</div>
                      </div>
                      <ChevronRight size={12} className="shrink-0 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  );
                }) : (
                  <div className="px-4 py-3 text-[12px] leading-snug text-muted-foreground">
                    {t("detail.evidence.empty")}
                  </div>
                )}
              </div>
            )}
          </section>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-background px-2 py-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mono text-[13.5px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function DossierList({ label, items, mono = false }: { label: string; items: string[]; mono?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        <span className="mono ml-1 rounded-sm bg-secondary px-1 text-[10px] text-foreground/70">{items.length}</span>
      </div>
      <ul className="mt-1 space-y-0.5">
        {items.map((it, i) => (
          <li
            key={`${label}-${i}`}
            className={cn(
              "flex gap-1.5 border-b border-border/40 py-0.5 last:border-0 text-foreground/90",
              mono ? "mono text-[11.5px] break-all" : "text-[12.5px] leading-snug",
            )}
          >
            <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-primary/70" />
            <span className="min-w-0 flex-1">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}