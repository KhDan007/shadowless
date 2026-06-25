import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SentinelEntity, LogRow, RiskLevel } from "./data";
import type {
  LiveEdge,
  InvestigationMeta,
  EdgeMetaMap,
  SignalResponse,
  TaskStatusResponse,
} from "@/lib/sentinelApi";
import type { DossierCard, DossierResponse } from "@/lib/sentinelApi";

/** Backwards-compatible export — no seed data; the graph starts empty. */
export const MOCK_EDGES: LiveEdge[] = [];

export interface ScanState {
  active: boolean;
  step: string;
  startedAt: number | null;
  error: string | null;
}

export interface DossierState {
  loading: boolean;
  data: DossierCard | null;
  error: string | null;
  nodeId: string | null;
}

const EMPTY_DOSSIER: DossierState = { loading: false, data: null, error: null, nodeId: null };

interface SentinelDataStore {
  entities: SentinelEntity[];
  edges: LiveEdge[];
  edgeMeta: EdgeMetaMap;
  logRows: LogRow[];
  /** True once a live investigation graph has been applied at least once. */
  isLive: boolean;
  /** True while the AppShell is hydrating the persisted investigation. */
  isHydrating: boolean;
  /** Always false — the demo/seed dataset has been removed. */
  isDemo: boolean;
  scan: ScanState;
  investigationId: string | null;
  investigation: InvestigationMeta | null;
  /** Persisted list of investigations the user has opened, newest-first. */
  knownInvestigations: InvestigationMeta[];
  dossier: DossierState;
  dossierFull: DossierResponse | null;
  signals: SignalResponse[];
  taskStatus: TaskStatusResponse | null;
  beginScan(): void;
  setStep(step: string): void;
  failScan(msg: string): void;
  applyLive(payload: { entities: SentinelEntity[]; edges: LiveEdge[]; edgeMeta?: EdgeMetaMap; logRows?: LogRow[]; investigation?: InvestigationMeta | null }): void;
  resetToMock(): void;
  setHydrating(v: boolean): void;
  setInvestigationId(id: string | null): void;
  removeKnownInvestigation(id: string): void;
  beginDossier(nodeId: string): void;
  setDossier(data: DossierCard): void;
  setDossierFull(data: DossierResponse | null): void;
  failDossier(msg: string): void;
  clearDossier(): void;
  setSignals(s: SignalResponse[]): void;
  setTaskStatus(t: TaskStatusResponse | null): void;
}

function signalRisk(r: SignalResponse["risk"]): RiskLevel {
  const v = (r || "").toUpperCase();
  if (v === "HIGH") return "high";
  if (v === "MEDIUM") return "medium";
  if (v === "LOW") return "low";
  return "low";
}

function signalsToLogRows(signals: SignalResponse[]): LogRow[] {
  return signals.map((s) => ({
    id: s.id,
    time: s.time || "",
    source: s.source || "—",
    entity: s.node_id || "—",
    finding: s.finding || "",
    confidence: s.confidence != null ? Math.round(s.confidence) : 0,
    risk: signalRisk(s.risk),
    status: (s.status as LogRow["status"]) || "open",
  }));
}

export const useSentinelData = create<SentinelDataStore>()(
  persist(
    (set) => ({
      entities: [],
      edges: [],
      edgeMeta: {},
      logRows: [],
      isLive: false,
      isHydrating: false,
      isDemo: false,
      scan: { active: false, step: "", startedAt: null, error: null },
      investigationId: null,
      investigation: null,
      knownInvestigations: [],
      dossier: EMPTY_DOSSIER,
      dossierFull: null,
      signals: [],
      taskStatus: null,
      beginScan: () => set({ scan: { active: true, step: "queued", startedAt: Date.now(), error: null } }),
      setStep: (step) => set((s) => ({ scan: { ...s.scan, step } })),
      failScan: (msg) => set((s) => ({ scan: { ...s.scan, active: false, error: msg } })),
      applyLive: (p) => set((s) => {
        const inv = p.investigation ?? null;
        let known = s.knownInvestigations;
        if (inv) {
          const rest = known.filter((k) => k.id !== inv.id);
          known = [inv, ...rest].slice(0, 25);
        }
        return {
          entities: p.entities,
          edges: p.edges,
          edgeMeta: p.edgeMeta ?? {},
          // logRows is owned by setSignals — don't clobber on graph refetch.
          logRows: s.logRows,
          isLive: true,
          isDemo: false,
          scan: { active: false, step: "done", startedAt: null, error: null },
          investigation: inv,
          knownInvestigations: known,
          dossier: EMPTY_DOSSIER,
          dossierFull: null,
        };
      }),
      resetToMock: () => set({
        entities: [],
        edges: [],
        edgeMeta: {},
        logRows: [],
        isLive: false,
        isDemo: false,
        scan: { active: false, step: "", startedAt: null, error: null },
        investigationId: null,
        investigation: null,
        dossier: EMPTY_DOSSIER,
        dossierFull: null,
        signals: [],
        taskStatus: null,
      }),
      setHydrating: (v) => set({ isHydrating: v }),
      setInvestigationId: (id) => set({ investigationId: id }),
      removeKnownInvestigation: (id) => set((s) => ({
        knownInvestigations: s.knownInvestigations.filter((k) => k.id !== id),
        investigationId: s.investigationId === id ? null : s.investigationId,
        investigation: s.investigation?.id === id ? null : s.investigation,
      })),
      beginDossier: (nodeId) => set({ dossier: { loading: true, data: null, error: null, nodeId } }),
      setDossier: (data) => set((s) => ({ dossier: { ...s.dossier, loading: false, data, error: null } })),
      setDossierFull: (data) => set({ dossierFull: data }),
      failDossier: (msg) => set((s) => ({ dossier: { ...s.dossier, loading: false, error: msg } })),
      clearDossier: () => set({ dossier: EMPTY_DOSSIER, dossierFull: null }),
      setSignals: (signals) => set(() => ({
        signals,
        logRows: signalsToLogRows(signals),
      })),
      setTaskStatus: (taskStatus) => set({ taskStatus }),
    }),
    {
      name: "shadowless.sentinel.v1",
      storage: createJSONStorage(() => localStorage),
      // Only persist the pointer to the investigation. The graph, signals,
      // dossier and task state are authoritative on the backend — refetch
      // them on mount so a refresh never resurrects stale live data nor
      // leaves a half-mock / half-live blend on the screen.
      partialize: (s) => ({
        investigationId: s.investigationId,
        knownInvestigations: s.knownInvestigations,
      }),
    },
  ),
);