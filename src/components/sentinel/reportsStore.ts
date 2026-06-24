import { create } from "zustand";
import { persist } from "zustand/middleware";
import { REPORTS, type Report, type RiskLevel } from "./data";

interface ReportsState {
  custom: Report[];
  add: (r: Report) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useReportsStore = create<ReportsState>()(
  persist(
    (set) => ({
      custom: [],
      add: (r) => set((s) => ({ custom: [r, ...s.custom] })),
      remove: (id) => set((s) => ({ custom: s.custom.filter((r) => r.id !== id) })),
      clear: () => set({ custom: [] }),
    }),
    { name: "shadowless.reports.v1" }
  )
);

/** Read all reports (custom-first, then seed). Safe to call from loaders. */
export function getAllReports(): Report[] {
  return [...useReportsStore.getState().custom, ...REPORTS];
}

export function getReport(id: string): Report | undefined {
  return getAllReports().find((r) => r.id === id);
}

export function useAllReports(): Report[] {
  const custom = useReportsStore((s) => s.custom);
  return [...custom, ...REPORTS];
}

/** Risk ranking helper used during generation. */
export function rankRisk(r: RiskLevel): number {
  return ({ low: 1, medium: 2, high: 3, critical: 4 } as const)[r];
}

export function maxRisk(levels: RiskLevel[]): RiskLevel {
  if (!levels.length) return "low";
  return levels.reduce((a, b) => (rankRisk(b) > rankRisk(a) ? b : a), "low" as RiskLevel);
}