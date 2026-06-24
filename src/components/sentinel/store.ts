import { create } from "zustand";
import {
  ENTITIES as MOCK_ENTITIES,
  LOG_ROWS as MOCK_LOG_ROWS,
  type SentinelEntity,
  type LogRow,
} from "./data";
import type { LiveEdge } from "@/lib/sentinelApi";

export const MOCK_EDGES: LiveEdge[] = [
  ["e-tg", "e-alpha", "high", 94],
  ["e-forum", "e-alpha", "med", 82],
  ["e-osint", "e-alpha", "low", 58],
  ["e-alpha", "e-w1", "high", 97],
  ["e-alpha", "e-w2", "med", 74],
  ["e-alpha", "e-phone", "med", 69],
  ["e-alpha", "e-loc", "low", 64],
  ["e-w1", "e-w2", "low", 61],
  ["e-phone", "e-loc", "low", 55],
];

export interface ScanState {
  active: boolean;
  step: string;
  startedAt: number | null;
  error: string | null;
}

interface SentinelDataStore {
  entities: SentinelEntity[];
  edges: LiveEdge[];
  logRows: LogRow[];
  isLive: boolean;
  scan: ScanState;
  beginScan(): void;
  setStep(step: string): void;
  failScan(msg: string): void;
  applyLive(payload: { entities: SentinelEntity[]; edges: LiveEdge[]; logRows: LogRow[] }): void;
  resetToMock(): void;
}

export const useSentinelData = create<SentinelDataStore>((set) => ({
  entities: MOCK_ENTITIES,
  edges: MOCK_EDGES,
  logRows: MOCK_LOG_ROWS,
  isLive: false,
  scan: { active: false, step: "", startedAt: null, error: null },
  beginScan: () => set({ scan: { active: true, step: "queued", startedAt: Date.now(), error: null } }),
  setStep: (step) => set((s) => ({ scan: { ...s.scan, step } })),
  failScan: (msg) => set((s) => ({ scan: { ...s.scan, active: false, error: msg } })),
  applyLive: (p) => set({
    entities: p.entities.length ? p.entities : MOCK_ENTITIES,
    edges: p.edges,
    logRows: p.logRows.length ? p.logRows : MOCK_LOG_ROWS,
    isLive: p.entities.length > 0,
    scan: { active: false, step: "done", startedAt: null, error: null },
  }),
  resetToMock: () => set({
    entities: MOCK_ENTITIES,
    edges: MOCK_EDGES,
    logRows: MOCK_LOG_ROWS,
    isLive: false,
    scan: { active: false, step: "", startedAt: null, error: null },
  }),
}));