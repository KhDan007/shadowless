import { API_BASE } from "./config";
import type { SentinelEntity, RiskLevel, EntityKind, LogRow } from "@/components/sentinel/data";

export type ScanSource = "telegram" | "darknet" | "mock";
export type EdgeWeight = "high" | "med" | "low";
export type LiveEdge = [string, string, EdgeWeight, number];

export interface ScanResponse { task_id: string; investigation_id: string; status: string }
export interface TaskResponse { task_id: string; status: string; current_step?: string; error?: string }

export interface TaskStepInfo {
  name: string;
  status: string;       // "pending" | "running" | "done" | "error"
  progress: number;     // 0-100
  time: string | null;
}

export interface TaskStatusResponse {
  task_id?: string;
  status: string;              // "queued" | "running" | "done" | "error"
  investigation_id?: string;
  current_step: string | null;
  progress: number;            // 0-100
  eta_seconds: number | null;
  steps: TaskStepInfo[];
  error?: string;
}

export interface InvestigationMeta {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface StatsResponse {
  investigations: number;
  entities_extracted: number;
  relations: number;
  high_risk_clusters: number;
  sources_monitored: number;
  signals_processed: number;
  analyst_hours_saved: number;
  signals_per_hour?: { hour: string; count: number }[];
  risk_distribution?: Record<string, number>;
  top_sources?: { source: string; count: number }[];
}

export interface DossierCard {
  summary: string;
  products: string[];
  sale_points: string[];
  suppliers: string[];
  contacts: string[];
  wallets: string[];
  risk_rationale: string;
}

export interface DossierEvidenceRef {
  id: string;
  source: string | null;
  source_url: string | null;
  snippet: string;
  time: string | null;
  confidence: number | null;
}

export interface DossierTimelineItem {
  time: string | null;
  source: string | null;
  snippet: string;
  evidence_id: string;
}

export interface DossierResponse {
  investigation_id: string;
  node_id: string;
  label: string;
  type: string;
  risk_level: string | null;
  card: DossierCard;
  evidence_refs?: DossierEvidenceRef[];
  timeline?: DossierTimelineItem[];
  confidence?: number | null;
  generated_at?: string;
  model_version?: string;
}

export interface SignalResponse {
  id: string;
  time: string | null;
  source: string;
  finding: string;
  confidence: number | null;
  risk: "HIGH" | "MEDIUM" | "LOW" | null;
  status: string;
  evidence_id: string;
  node_id: string | null;
}

export interface EvidenceDetailResponse {
  id: string;
  source: string | null;
  source_url: string | null;
  snippet: string;
  time: string | null;
  confidence: number | null;
  custody_steps: Record<string, unknown>[];
  artifacts: Record<string, unknown>[];
}

export interface ReportRecord {
  id: string;
  investigation_id: string;
  title: string;
  format: string;
  status: string;
  created_at: string;
}

export interface ReportsResponse {
  investigation_id: string;
  reports: ReportRecord[];
  storage: string;
}

export interface EdgeMeta {
  relation: string;
  confidence: number;
  weight: EdgeWeight;
  evidenceIds: string[];
  firstSeen?: string;
  lastSeen?: string;
}

export type EdgeMetaMap = Record<string, EdgeMeta>;

export const edgeMetaKey = (from: string, to: string) => `${from}::${to}`;

interface ApiNode {
  data: {
    id: string;
    label: string;
    type: string;
    alias?: string | null;
    risk_level?: "HIGH" | "MEDIUM" | "LOW" | string;
    properties?: {
      risk_score?: number;
      confidence?: number;
      reliability?: "A" | "B" | "C" | "D";
      evidence?: {
        id?: string;
        type?: string;
        match?: string;
        snippet?: string;
        source?: string;
        source_url?: string;
        time?: string;
      }[];
      risk_factors?: {
        category?: string;
        indicator?: string;
        score?: number;
        time?: string;
        source?: string;
      }[];
      aliases?: string[];
      first_seen?: string;
      last_seen?: string;
      keyword_hits?: Record<string, string[]>;
      entities?: Record<string, string[]>;
      source?: string;
      role?: string;
    };
  };
}
interface ApiEdge {
  data: {
    source: string;
    target: string;
    relation_type?: string;
    confidence?: number;
    weight?: EdgeWeight;
    evidence_ids?: string[];
    first_seen?: string;
    last_seen?: string;
  };
}
export interface ApiGraph { nodes: ApiNode[]; edges: ApiEdge[]; investigation?: InvestigationMeta }

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

function formatCreatedAt(iso: string | undefined): string {
  if (!iso) return nowIso() + " UTC+0";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} UTC+0`;
}

export function mapApiGraph(g: ApiGraph, source: ScanSource): {
  entities: SentinelEntity[];
  edges: LiveEdge[];
  edgeMeta: EdgeMetaMap;
  logRows: LogRow[];
  investigation: InvestigationMeta | null;
} {
  const connCount: Record<string, number> = {};
  for (const e of g.edges || []) {
    const s = e.data?.source, t = e.data?.target;
    if (!s || !t) continue;
    connCount[s] = (connCount[s] ?? 0) + 1;
    connCount[t] = (connCount[t] ?? 0) + 1;
  }

  const investigation = g.investigation ?? null;
  const lastSeen = formatCreatedAt(investigation?.created_at);

  const entities: SentinelEntity[] = (g.nodes || []).map((n) => {
    const d = n.data;
    const props = d.properties || {};
    const score = Math.max(0, Math.min(100, Math.round(props.risk_score ?? 0)));
    const risk = mapRisk(d.risk_level, score);
    const isLlm = props.source === "llm";
    const apiConf = typeof props.confidence === "number"
      ? Math.round(Math.max(0, Math.min(1, props.confidence)) <= 1 ? props.confidence * 100 : props.confidence)
      : null;
    const confidence = apiConf ?? (isLlm ? 65 : 95);
    const reliability: SentinelEntity["reliability"] = (props.reliability as SentinelEntity["reliability"]) ?? (isLlm ? "B" : "A");
    const sourceLabel = isLlm ? "AI inference" : SOURCE_LABEL[source];
    const ev = Array.isArray(props.evidence) ? props.evidence : [];
    const hits = props.keyword_hits || {};
    const hitKeys = Object.keys(hits);
    const indicatorsFlat = hitKeys.flatMap((k) => hits[k] || []);
    const identifiers: SentinelEntity["identifiers"] = [
      { label: (d.type || "ENTITY").toUpperCase(), value: d.label },
    ];
    if (hitKeys.length) identifiers.push({ label: "INDICATORS", value: hitKeys.join(", ") });
    if (Array.isArray(props.aliases) && props.aliases.length) {
      identifiers.push({ label: "ALIASES", value: props.aliases.slice(0, 4).join(", ") });
    }
    if (props.first_seen) identifiers.push({ label: "FIRST SEEN", value: props.first_seen });
    if (props.last_seen)  identifiers.push({ label: "LAST SEEN",  value: props.last_seen });

    const kindLabel = mapKind(d.type);
    const summary =
      `${kindLabel.charAt(0).toUpperCase() + kindLabel.slice(1)} flagged by ${indicatorsFlat.length || hitKeys.length || ev.length || 0} indicator${(indicatorsFlat.length || hitKeys.length || ev.length) === 1 ? "" : "s"}` +
      (hitKeys.length ? ` (${hitKeys.slice(0, 6).join(", ")})` : "") +
      ` across ${ev.length} evidence fragment${ev.length === 1 ? "" : "s"}.`;

    const entity: SentinelEntity = {
      id: d.id,
      kind: kindLabel,
      label: d.label,
      alias: d.alias || undefined,
      risk,
      riskScore: score,
      confidence,
      connections: connCount[d.id] ?? 0,
      identifiers,
      summary,
      source: sourceLabel,
      reliability,
      lastSeen: props.last_seen ? formatCreatedAt(props.last_seen) : lastSeen,
      evidence: ev.slice(0, 6).map((e, i) => ({
        id: String(e.id || e.match || `${d.id}-ev-${i}`).slice(0, 64) || `${d.id}-ev-${i}`,
        title: (e.snippet ? String(e.snippet) : String(e.match || e.type || "evidence")).slice(0, 120),
        time: e.time ?? "",
      })),
    };
    if (Array.isArray(props.risk_factors) && props.risk_factors.length) {
      entity.riskFactors = props.risk_factors.slice(0, 10).map((f) => ({
        label: String(f.indicator || f.category || "signal"),
        delta: Math.max(0, Math.round(Number(f.score ?? 0))),
        time: String(f.time ?? "—"),
        source: String(f.source ?? "OSINT"),
      }));
    }
    if (props.role) (entity as SentinelEntity & { role?: string }).role = props.role;
    return entity;
  });

  const edges: LiveEdge[] = [];
  const edgeMeta: EdgeMetaMap = {};
  for (const e of g.edges || []) {
    if (!e.data?.source || !e.data?.target) continue;
    const apiConf = typeof e.data.confidence === "number"
      ? Math.round(e.data.confidence <= 1 ? e.data.confidence * 100 : e.data.confidence)
      : 80;
    const conf = Math.max(0, Math.min(100, apiConf));
    const weight: EdgeWeight = e.data.weight ?? (conf >= 85 ? "high" : conf >= 65 ? "med" : "low");
    edges.push([e.data.source, e.data.target, weight, conf]);
    edgeMeta[edgeMetaKey(e.data.source, e.data.target)] = {
      relation: String(e.data.relation_type || "MENTIONS"),
      confidence: conf,
      weight,
      evidenceIds: Array.isArray(e.data.evidence_ids) ? e.data.evidence_ids : [],
      firstSeen: e.data.first_seen,
      lastSeen: e.data.last_seen,
    };
  }

  const time = nowIso();
  const logRows: LogRow[] = [];
  let i = 0;
  for (const ent of entities) {
    for (const ev of ent.evidence) {
      logRows.push({
        id: `LIVE-${String(++i).padStart(4, "0")}`,
        time: ev.time || time,
        source: ent.source,
        entity: ent.label,
        finding: ev.title,
        confidence: ent.confidence,
        risk: ent.risk,
        status: "open",
      });
    }
  }

  return { entities, edges, edgeMeta, logRows, investigation };
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

export async function fetchTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const r = await fetch(`${API_BASE}/api/v1/tasks/${encodeURIComponent(taskId)}`);
  if (!r.ok) throw new Error(`task failed: ${r.status}`);
  const j = await r.json();
  return {
    task_id: j.task_id,
    status: String(j.status ?? "unknown"),
    investigation_id: j.investigation_id,
    current_step: j.current_step ?? null,
    progress: typeof j.progress === "number" ? j.progress : 0,
    eta_seconds: j.eta_seconds ?? null,
    steps: Array.isArray(j.steps) ? j.steps : [],
    error: j.error,
  };
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

export async function fetchStats(): Promise<StatsResponse> {
  const r = await fetch(`${API_BASE}/api/v1/stats`);
  if (!r.ok) throw new Error(`stats failed: ${r.status}`);
  return r.json();
}

export async function fetchSignals(investigationId: string): Promise<SignalResponse[]> {
  const r = await fetch(`${API_BASE}/api/v1/investigations/${encodeURIComponent(investigationId)}/signals`);
  if (!r.ok) throw new Error(`signals failed: ${r.status}`);
  const j = await r.json();
  if (Array.isArray(j)) return j as SignalResponse[];
  if (j && Array.isArray(j.signals)) return j.signals as SignalResponse[];
  return [];
}

export async function fetchEvidence(evidenceId: string): Promise<EvidenceDetailResponse> {
  const r = await fetch(`${API_BASE}/api/v1/evidence/${encodeURIComponent(evidenceId)}`);
  if (!r.ok) throw new Error(`evidence failed: ${r.status}`);
  return r.json();
}

export async function createReport(investigationId: string, title = "Investigation report"): Promise<ReportRecord> {
  const r = await fetch(`${API_BASE}/api/v1/investigations/${encodeURIComponent(investigationId)}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, format: "json" }),
  });
  if (!r.ok) throw new Error(`report create failed: ${r.status}`);
  return r.json();
}

export async function fetchReports(investigationId: string): Promise<ReportsResponse> {
  const r = await fetch(`${API_BASE}/api/v1/investigations/${encodeURIComponent(investigationId)}/reports`);
  if (!r.ok) throw new Error(`reports failed: ${r.status}`);
  return r.json();
}