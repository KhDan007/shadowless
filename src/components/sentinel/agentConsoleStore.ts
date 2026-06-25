import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AgentEventType =
  | "scan_started"
  | "plan"
  | "scan"
  | "expand"
  | "graph_built"
  | "high_risk"
  | "scan_done"
  | "unknown";

export type ConnState = "connecting" | "live" | "reconnecting" | "off";

export interface ConsoleEntry {
  id: string;
  ts: number;
  type: AgentEventType;
  text: string;
  level: "info" | "warn" | "crit" | "ok";
  investigation_id?: string | null;
  raw?: unknown;
}

interface AgentConsoleStore {
  entries: ConsoleEntry[];
  conn: ConnState;
  push(entry: ConsoleEntry): void;
  clear(): void;
  setConn(c: ConnState): void;
}

const MAX = 300;

export const useAgentConsole = create<AgentConsoleStore>()(
  persist(
    (set) => ({
      entries: [],
      conn: "connecting",
      push: (entry) =>
        set((s) => {
          const next = [entry, ...s.entries];
          if (next.length > MAX) next.length = MAX;
          return { entries: next };
        }),
      clear: () => set({ entries: [] }),
      setConn: (conn) => set({ conn }),
    }),
    {
      name: "shadowless.console.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);