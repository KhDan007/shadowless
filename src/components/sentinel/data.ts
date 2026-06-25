export type RiskLevel = "low" | "medium" | "high" | "critical";
export type EntityKind =
  | "suspect"
  | "telegram"
  | "forum"
  | "wallet"
  | "phone"
  | "location"
  | "osint";

export interface SentinelEntity {
  id: string;
  kind: EntityKind;
  label: string;
  alias?: string;
  risk: RiskLevel;
  riskScore: number;
  confidence: number;
  connections: number;
  identifiers: { label: string; value: string }[];
  summary: string;
  source: string;
  reliability: "A" | "B" | "C" | "D";
  lastSeen: string;
  evidence: { id: string; title: string; time: string }[];
  /** Ordered contributions to the risk score. Most recent first.
   *  Sum is informational — model may also include priors/decay. */
  riskFactors?: { label: string; delta: number; time: string; source: string }[];
}

export const ENTITIES: SentinelEntity[] = [];

export const CASES: { id: string; title: string; risk: RiskLevel; entities: number }[] = [];

export interface LogRow {
  id: string;
  time: string;
  source: string;
  entity: string;
  finding: string;
  confidence: number;
  risk: RiskLevel;
  status: "open" | "review" | "validated" | "archived";
}

// Optional rich metadata, looked up by evidence id.
export interface EvidenceArtifact {
  kind: "screenshot" | "transcript" | "transaction" | "geo" | "metadata" | "document";
  filename: string;
  mime: string;
  sizeKb: number;
  sha256: string;
}
export interface CustodyStep {
  ts: string;         // YYYY-MM-DD HH:mm
  actor: string;
  action: string;     // e.g. "Ingested", "Hashed", "Signed", "Reviewed"
  note?: string;
}
export interface EvidenceDetail {
  collector: string;          // sensor/operator
  collectedAt: string;        // ISO-ish
  reliability: "A" | "B" | "C" | "D";
  classification: string;     // RESTRICTED // MIA-INTERNAL
  narrative: string;          // long-form description
  caseId: string;
  entityIds: string[];        // links into ENTITIES
  artifacts: EvidenceArtifact[];
  custody: CustodyStep[];
  tags: string[];
}

export const EVIDENCE_DETAILS: Record<string, EvidenceDetail> = {};

export function getEvidenceDetail(id: string): EvidenceDetail | undefined {
  return EVIDENCE_DETAILS[id];
}

export const LOG_ROWS: LogRow[] = [];

export const CONFIDENCE_TREND: { t: number; conf: number; risk: number }[] = [];

// ---------- Alerts ----------
export type AlertStatus = "unread" | "acked";
export interface AlertRow {
  id: string;
  time: string;            // HH:mm
  date: string;            // YYYY-MM-DD
  level: RiskLevel;
  entityId: string;        // links into ENTITIES
  message: string;
  source: string;
  status: AlertStatus;
}

export const ALERTS: AlertRow[] = [];

// ---------- Reports ----------
export interface ReportSection { heading: string; body: string }
export interface Report {
  id: string;
  title: string;
  created: string;
  state: "validated" | "review" | "archived";
  risk: RiskLevel;
  pages: number;
  caseId: string;
  author: string;
  classification: string;
  summary: string;
  sections: ReportSection[];
  entityIds: string[];
  evidenceIds: string[];
}

export const REPORTS: Report[] = [];

export function getReportById(id: string): Report | undefined {
  return REPORTS.find((r) => r.id === id);
}

// ---------- Investigation Timeline ----------
export type TimelineKind =
  | "evidence"     // raw evidence ingested
  | "ai"           // AI inference / correlation
  | "alert"        // alert raised
  | "ack"          // analyst acknowledged
  | "note"         // analyst note
  | "report"       // report generated
  | "case"         // case lifecycle (opened, escalated)
  | "action";      // operational action (MLAT, sweep, etc.)

export interface TimelineEvent {
  id: string;
  ts: string;            // ISO-ish "2026-06-24T14:22:00+05:00"
  date: string;          // "2026-06-24"
  time: string;          // "14:22"
  kind: TimelineKind;
  risk?: RiskLevel;
  title: string;
  detail: string;
  actor: string;         // who/what produced the event
  caseId: string;
  entityIds?: string[];
  evidenceIds?: string[];
  reportId?: string;
  pinned?: boolean;
}

export const TIMELINE_EVENTS: TimelineEvent[] = [];
