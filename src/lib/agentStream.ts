import { useEffect, useRef } from "react";
import { API_BASE } from "./config";
import { fetchGraph, mapApiGraph } from "./sentinelApi";
import { useSentinelData } from "@/components/sentinel/store";
import { useAgentConsole, type AgentEventType, type ConsoleEntry } from "@/components/sentinel/agentConsoleStore";
import { useNotifications } from "@/components/sentinel/notificationsStore";
import { useI18n } from "@/i18n";

interface AgentEvent {
  type: string;
  ts?: number | string;
  investigation_id?: string;
  // scan_started
  target?: string;
  // plan / expand
  queries?: string[];
  // scan
  query?: string;
  round?: number;
  depth?: number;
  found?: number;
  kept?: number;
  // expand
  cross_refs?: number;
  entity_refs?: number;
  // graph_built / scan_done
  nodes?: number;
  edges?: number;
  messages?: number;
  // high_risk
  label?: string;
  node_type?: string;
  risk_score?: number;
  [k: string]: unknown;
}

function classify(type: string): AgentEventType {
  switch (type) {
    case "scan_started":
    case "plan":
    case "scan":
    case "expand":
    case "graph_built":
    case "high_risk":
    case "scan_done":
      return type;
    default:
      return "unknown";
  }
}

function levelFor(t: AgentEventType): ConsoleEntry["level"] {
  if (t === "high_risk") return "crit";
  if (t === "scan_done" || t === "graph_built") return "ok";
  if (t === "expand" || t === "plan") return "info";
  return "info";
}

function format(
  e: AgentEvent,
  type: AgentEventType,
  t: (k: string, v?: Record<string, string | number>) => string,
): string {
  const q = (e.queries ?? []).join(", ");
  switch (type) {
    case "scan_started":
      return t("console.evt.scan_started", { target: e.target ?? "—" });
    case "plan":
      return t("console.evt.plan", { count: (e.queries ?? []).length, queries: q });
    case "scan":
      return t("console.evt.scan", {
        query: e.query ?? "—",
        round: e.round ?? 0,
        depth: e.depth ?? 0,
        found: e.found ?? 0,
        kept: e.kept ?? 0,
      });
    case "expand":
      return t("console.evt.expand", {
        entity_refs: e.entity_refs ?? 0,
        cross_refs: e.cross_refs ?? 0,
        queries: q || "—",
      });
    case "graph_built":
      return t("console.evt.graph_built", { nodes: e.nodes ?? 0, edges: e.edges ?? 0 });
    case "high_risk":
      return t("console.evt.high_risk", {
        label: e.label ?? "—",
        node_type: e.node_type ?? "—",
        risk_score: e.risk_score ?? 0,
      });
    case "scan_done":
      return t("console.evt.scan_done", {
        nodes: e.nodes ?? 0,
        edges: e.edges ?? 0,
        messages: e.messages ?? 0,
      });
    default:
      return `· ${e.type}`;
  }
}

/** Mount once at the app shell. Opens SSE, fans out events to console store
 *  and triggers graph re-fetch on graph_built / scan_done. */
export function useAgentStream() {
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    const push = useAgentConsole.getState().push;
    const setConn = useAgentConsole.getState().setConn;

    let closed = false;
    let es: EventSource | null = null;
    let refetchTimer: ReturnType<typeof setTimeout> | null = null;
    const lastRefetch: Record<string, number> = {};

    const scheduleGraphRefetch = (investigationId: string | undefined) => {
      if (!investigationId) return;
      const now = Date.now();
      if (lastRefetch[investigationId] && now - lastRefetch[investigationId] < 500) return;
      lastRefetch[investigationId] = now;
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(async () => {
        try {
          const graph = await fetchGraph(investigationId);
          const mapped = mapApiGraph(graph);
          useSentinelData.getState().applyLive(mapped);
          useSentinelData.getState().setInvestigationId(investigationId);
        } catch (err) {
          // silent — console already shows the source event
          console.warn("[agentStream] graph refetch failed", err);
        }
      }, 250);
    };

    const connect = () => {
      try {
        setConn("connecting");
        es = new EventSource(`${API_BASE}/api/v1/stream`);
      } catch (err) {
        console.warn("[agentStream] EventSource init failed", err);
        setConn("off");
        return;
      }

      es.onopen = () => setConn("live");

      es.onmessage = (msg) => {
        let payload: AgentEvent;
        try {
          payload = JSON.parse(msg.data);
        } catch {
          return;
        }
        const type = classify(String(payload.type ?? ""));
        const text = format(payload, type, tRef.current);
        const tsNum = typeof payload.ts === "number"
          ? (payload.ts > 1e12 ? payload.ts : payload.ts * 1000)
          : Date.now();
        const entry: ConsoleEntry = {
          id: `${tsNum}-${Math.random().toString(36).slice(2, 7)}`,
          ts: tsNum,
          type,
          text,
          level: levelFor(type),
          investigation_id: payload.investigation_id ?? null,
          raw: payload,
        };
        push(entry);

        if (type === "graph_built" || type === "scan_done") {
          scheduleGraphRefetch(payload.investigation_id);
        }
        if (type === "high_risk") {
          // Push to top-right notifications popup (no bottom-right toast,
          // and dedupe so SSE replays on reload don't re-notify).
          const key = `high_risk:${payload.investigation_id ?? ""}:${payload.label ?? ""}:${payload.node_type ?? ""}:${payload.risk_score ?? ""}`;
          useNotifications.getState().push(key, {
            ts: tsNum,
            level: "crit",
            title: tRef.current("console.toast.high_risk.title", { label: payload.label ?? "—" }),
            desc: tRef.current("console.toast.high_risk.desc", {
              node_type: payload.node_type ?? "—",
              risk_score: payload.risk_score ?? 0,
            }),
            investigation_id: payload.investigation_id ?? null,
          });
        }
      };

      es.onerror = () => {
        if (closed) return;
        setConn("reconnecting");
        // EventSource auto-reconnects; no manual close needed.
      };
    };

    connect();

    return () => {
      closed = true;
      if (refetchTimer) clearTimeout(refetchTimer);
      if (es) es.close();
      setConn("off");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}