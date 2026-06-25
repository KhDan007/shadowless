// Mock data has been removed — the UI now consumes only live backend data.
// These exports remain as empty structures so existing import sites compile
// and naturally render their empty states until a real scan populates them.

export const DEMO_METRICS = {
  sourcesMonitored: 0,
  signalsProcessed: 0,
  entitiesExtracted: 0,
  highRiskClusters: 0,
  analystHoursSaved: 0,
  duplicatesRemoved: 0,
  reliability: 0,
  manualReview: 0,
  lastScanSeconds: 0,
  confidence: "—",
};

export const DEMO_SOURCES: { id: string; name: string; kind: string; reliability: number; badge: string }[] = [];

export const PIPELINE_STEPS = [
  { key: "collect",   label: "Collect",   note: "ingest signals from monitored sources" },
  { key: "clean",     label: "Clean",     note: "remove duplicates and noise" },
  { key: "extract",   label: "Extract",   note: "entities, keywords, locations, timestamps" },
  { key: "match",     label: "Match",     note: "connect related signals across sources" },
  { key: "score",     label: "Score",     note: "assign risk and confidence" },
  { key: "visualize", label: "Visualize", note: "build dashboard analytics" },
  { key: "report",    label: "Report",    note: "generate investigator brief" },
] as const;

export const SCAN_PHASES = [
  "Connecting",
  "Collecting",
  "Parsing",
  "Extracting entities",
  "Matching patterns",
  "Risk scoring",
  "Complete",
] as const;

export const CONFIDENCE_SERIES: { t: string; confidence: number; signals: number }[] = [];
export const SOURCE_DISTRIBUTION: { name: string; value: number; color: string }[] = [];
export const RISK_TIMELINE: { t: string; low: number; med: number; high: number; crit: number }[] = [];
export const ENTITIES: { id: string; label: string; risk: string; connections: number; role: string }[] = [];
export const KEYWORD_CLUSTERS: { word: string; weight: number }[] = [];
export const ALERTS: { id: string; severity: string; title: string; source: string; time: string }[] = [];
export const SIGNALS_FEED: { time: string; source: string; text: string }[] = [];

export const GENERATED_SUMMARY = "";
export const KEY_FINDINGS: string[] = [];
export const NEXT_ACTIONS: string[] = [];
