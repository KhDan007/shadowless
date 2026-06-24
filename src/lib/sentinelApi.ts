import { API_BASE } from "./config";
import type { SentinelEntity, RiskLevel, EntityKind, LogRow } from "@/components/sentinel/data";

export type ScanSource = "telegram" | "darknet" | "mock";
export type EdgeWeight = "high" | "med" | "low";
export type LiveEdge = [string, string, EdgeWeight, number];

export interface ScanResponse { task_id: string; investigation_id: string; status: string }
export interface TaskResponse { task_id: string; status: string; current_step?: string; error?: string }

export interface DossierCard {
  summary: string;
  products: string[];
  sale_points: string[];
  suppliers: string[];
  contacts: string[];
  wallets: string[];
  risk_rationale: string;
}

export interface DossierResponse {
  investigation_id: string;
  node_id: string;
  label: string;
  type: string;
  risk_level: string | null;
  card: DossierCard;
}

interface ApiNode {
  data: {
    id: string;
    label: string;
    type: string;
    risk_level?: "HIGH" | "MEDIUM" | "LOW" | string;
    properties?: {
      risk_score?: number;
      evidence?: { type?: string; match?: string; snippet?: string }[];
      keyword_hits?: Record<string, string[]>;
      source?: string;
      role?: string;
    };
  };
}
interface ApiEdge { data: { source: string; target: string; relation_type?: string } }
export interface ApiGraph { nodes: ApiNode[]; edges: ApiEdge[] }

const SOURCE_LABEL: Record<ScanSource, string> = {
  telegram: "Telegram Crawl",
  darknet: "DarkNet Crawl",
  mock: "OSINT",
};

function mapKind(t: string): EntityKind {
  const k = (t || "").toLowerCase();
  if (k === "suspect" || k === "person") return "suspect";
  if (k === "wallet") return "wallet";
  if (k === "phone") return "phone";
  if (k === "tg_alias") return "telegram";
  if (k === "chat") return "forum";
  if (k === "location" || k === "geo") return "location";
  return "osint";
}

function mapRisk(level: string | undefined, score: number): RiskLevel {
  const l = (level || "").toUpperCase();
  if (l === "HIGH") return score >= 70 ? "critical" : "high";
  if (l === "MEDIUM") return "medium";
  if (l === "LOW") return "low";
  return score >= 70 ? "high" : score >= 40 ? "medium" : "low";
}

function nowIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function mapApiGraph(g: ApiGraph, source: ScanSource): { entities: SentinelEntity[]; edges: LiveEdge[]; logRows: LogRow[] } {
  const connCount: Record<string, number> = {};
  for (const e of g.edges || []) {
    const s = e.data?.source, t = e.data?.target;
    if (!s || !t) continue;
    connCount[s] = (connCount[s] ?? 0) + 1;
    connCount[t] = (connCount[t] ?? 0) + 1;
  }

  const entities: SentinelEntity[] = (g.nodes || []).map((n) => {
    const d = n.data;
    const props = d.properties || {};
    const score = Math.max(0, Math.min(100, Math.round(props.risk_score ?? 0)));
    const risk = mapRisk(d.risk_level, score);
    const isLlm = props.source === "llm";
    const confidence = isLlm ? 65 : 95;
    const reliability: SentinelEntity["reliability"] = isLlm ? "B" : "A";
    const sourceLabel = isLlm ? "AI inference" : SOURCE_LABEL[source];
    const ev = Array.isArray(props.evidence) ? props.evidence : [];
    const hits = props.keyword_hits || {};
    const hitKeys = Object.keys(hits);
    const indicatorsFlat = hitKeys.flatMap((k) => hits[k] || []);
    const identifiers: SentinelEntity["identifiers"] = [
      { label: (d.type || "ENTITY").toUpperCase(), value: d.label },
    ];
    if (hitKeys.length) identifiers.push({ label: "INDICATORS", value: hitKeys.join(", ") });

    const kindLabel = mapKind(d.type);
    const summary =
      `${kindLabel.charAt(0).toUpperCase() + kindLabel.slice(1)} flagged by ${indicatorsFlat.length || hitKeys.length || ev.length || 0} indicator${(indicatorsFlat.length || hitKeys.length || ev.length) === 1 ? "" : "s"}` +
      (hitKeys.length ? ` (${hitKeys.slice(0, 6).join(", ")})` : "") +
      ` across ${ev.length} evidence fragment${ev.length === 1 ? "" : "s"}.`;

    const entity: SentinelEntity = {
      id: d.id,
      kind: kindLabel,
      label: d.label,
      risk,
      riskScore: score,
      confidence,
      connections: connCount[d.id] ?? 0,
      identifiers,
      summary,
      source: sourceLabel,
      reliability,
      lastSeen: nowIso() + " UTC+0",
      evidence: ev.slice(0, 6).map((e, i) => ({
        id: String(e.match || `${d.id}-ev-${i}`).slice(0, 14) || `${d.id}-ev-${i}`,
        title: (e.snippet ? String(e.snippet) : String(e.match || e.type || "evidence")).slice(0, 80),
        time: "",
      })),
    };
    if (props.role) (entity as SentinelEntity & { role?: string }).role = props.role;
    return entity;
  });

  const edges: LiveEdge[] = (g.edges || [])
    .filter((e) => e.data?.source && e.data?.target)
    .map((e) => {
      const conf = 80;
      const weight: EdgeWeight = conf >= 85 ? "high" : conf >= 65 ? "med" : "low";
      return [e.data.source, e.data.target, weight, conf] as LiveEdge;
    });

  const time = nowIso();
  const logRows: LogRow[] = [];
  let i = 0;
  for (const ent of entities) {
    for (const ev of ent.evidence) {
      logRows.push({
        id: `LIVE-${String(++i).padStart(4, "0")}`,
        time,
        source: ent.source,
        entity: ent.label,
        finding: ev.title,
        confidence: ent.confidence,
        risk: ent.risk,
        status: "open",
      });
    }
  }

  return { entities, edges, logRows };
}

export async function startScan(target: string, type: ScanSource): Promise<ScanResponse> {
  const r = await fetch(`${API_BASE}/api/v1/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, type }),
  });
  if (!r.ok) throw new Error(`scan failed: ${r.status}`);
  return r.json();
}

export async function fetchTask(taskId: string): Promise<TaskResponse> {
  const r = await fetch(`${API_BASE}/api/v1/tasks/${encodeURIComponent(taskId)}`);
  if (!r.ok) throw new Error(`task failed: ${r.status}`);
  return r.json();
}

export async function fetchGraph(investigationId: string): Promise<ApiGraph> {
  const r = await fetch(`${API_BASE}/api/v1/investigations/${encodeURIComponent(investigationId)}/graph`);
  if (!r.ok) throw new Error(`graph failed: ${r.status}`);
  return r.json();
}

export async function fetchDossier(investigationId: string, nodeId: string): Promise<DossierResponse> {
  const url = `${API_BASE}/api/v1/investigations/${encodeURIComponent(investigationId)}/dossier?node_id=${encodeURIComponent(nodeId)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`dossier failed: ${r.status}`);
  return r.json();
}