// Simulated data only — for demo/presentation purposes.
// No real sources, no real scraping. Everything below is fictional.

export const DEMO_METRICS = {
  sourcesMonitored: 247,
  signalsProcessed: 18432,
  entitiesExtracted: 316,
  highRiskClusters: 7,
  analystHoursSaved: 184,
  duplicatesRemoved: 42,
  reliability: 87,
  manualReview: 3,
  lastScanSeconds: 14,
  confidence: "Medium-High",
};

export const DEMO_SOURCES = [
  { id: "tg",   name: "Telegram Channel Alpha",            kind: "Messaging",  reliability: 78, badge: "Simulated" },
  { id: "web",  name: "Public Web Monitor",                kind: "Web",        reliability: 91, badge: "Public" },
  { id: "osint",name: "OSINT Feed 03",                     kind: "OSINT",      reliability: 88, badge: "Vetted" },
  { id: "forum",name: "Forum Watchlist",                   kind: "Forum",      reliability: 72, badge: "Public" },
  { id: "news", name: "News Monitor KZ",                   kind: "News",       reliability: 94, badge: "Public" },
  { id: "case", name: "Uploaded Case Files",               kind: "Internal",   reliability: 99, badge: "Internal" },
  { id: "ti",   name: "Restricted-source Intelligence",    kind: "Threat-Intel", reliability: 84, badge: "Simulated" },
];

export const PIPELINE_STEPS = [
  { key: "collect",   label: "Collect",   note: "demo signals from monitored sources" },
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

export const CONFIDENCE_SERIES = [
  { t: "00:00", confidence: 42, signals: 12 },
  { t: "00:10", confidence: 51, signals: 28 },
  { t: "00:20", confidence: 58, signals: 47 },
  { t: "00:30", confidence: 63, signals: 74 },
  { t: "00:40", confidence: 71, signals: 96 },
  { t: "00:50", confidence: 76, signals: 128 },
  { t: "01:00", confidence: 82, signals: 161 },
  { t: "01:10", confidence: 85, signals: 198 },
  { t: "01:20", confidence: 87, signals: 232 },
];

export const SOURCE_DISTRIBUTION = [
  { name: "OSINT",     value: 34, color: "var(--accent-signal)" },
  { name: "Web",       value: 22, color: "var(--risk-low)" },
  { name: "Messaging", value: 18, color: "var(--risk-medium)" },
  { name: "Forum",     value: 12, color: "var(--risk-high)" },
  { name: "News",      value:  9, color: "var(--risk-critical)" },
  { name: "Internal",  value:  5, color: "#94a3b8" },
];

export const RISK_TIMELINE = [
  { t: "T-72h", low: 8,  med: 4, high: 1, crit: 0 },
  { t: "T-60h", low: 11, med: 6, high: 2, crit: 0 },
  { t: "T-48h", low: 9,  med: 8, high: 3, crit: 1 },
  { t: "T-36h", low: 12, med: 10, high: 4, crit: 1 },
  { t: "T-24h", low: 14, med: 13, high: 6, crit: 2 },
  { t: "T-12h", low: 18, med: 16, high: 8, crit: 3 },
  { t: "Now",   low: 22, med: 19, high: 11, crit: 3 },
];

export const ENTITIES = [
  { id: "ent-1", label: "Subject Alpha",   risk: "critical", connections: 14, role: "Coordinator (alleged)" },
  { id: "ent-2", label: "Subject Bravo",   risk: "high",     connections: 11, role: "Channel operator" },
  { id: "ent-3", label: "Subject Charlie", risk: "high",     connections:  9, role: "Recurring poster" },
  { id: "ent-4", label: "Wallet 0x…7af",   risk: "medium",   connections:  6, role: "Linked address" },
  { id: "ent-5", label: "Domain n-mirror", risk: "medium",   connections:  5, role: "Redirect host" },
  { id: "ent-6", label: "Handle @kz-obs",  risk: "low",      connections:  3, role: "Observer account" },
];

export const KEYWORD_CLUSTERS = [
  { word: "coordinated",  weight: 92 },
  { word: "transfer",     weight: 78 },
  { word: "mirror",       weight: 71 },
  { word: "rendezvous",   weight: 64 },
  { word: "encrypted",    weight: 58 },
  { word: "handoff",      weight: 52 },
  { word: "burner",       weight: 47 },
  { word: "obfuscation",  weight: 41 },
  { word: "kz-region",    weight: 36 },
  { word: "after-hours",  weight: 29 },
];

export const ALERTS = [
  { id: "AL-2048", severity: "critical", title: "Subject Alpha posted across 3 simulated channels in <60s", source: "OSINT Feed 03", time: "14s ago" },
  { id: "AL-2047", severity: "high",     title: "Repeated mention pattern detected across forum + messaging",  source: "Forum Watchlist", time: "2m ago" },
  { id: "AL-2046", severity: "high",     title: "New wallet address linked to existing cluster",                source: "Restricted-source Intel", time: "6m ago" },
  { id: "AL-2045", severity: "medium",   title: "After-hours activity spike from KZ-region observers",          source: "Public Web Monitor", time: "11m ago" },
  { id: "AL-2044", severity: "medium",   title: "42 duplicate signals auto-collapsed",                          source: "Clean stage", time: "12m ago" },
  { id: "AL-2043", severity: "low",      title: "Reliability re-balanced — News +3%, Forum -1%",                source: "Scoring engine", time: "18m ago" },
];

export const SIGNALS_FEED = [
  { time: "00:00:14", source: "OSINT Feed 03",          text: "Subject Alpha referenced in 3 indexed snippets" },
  { time: "00:00:31", source: "Public Web Monitor",     text: "Mirror domain n-mirror[.]example resolved to known cluster" },
  { time: "00:00:47", source: "Telegram Channel Alpha", text: "Pattern match: ‘rendezvous’ + ‘handoff’ within 90s" },
  { time: "00:01:05", source: "Forum Watchlist",        text: "Handle @kz-obs cross-posted same payload 4x" },
  { time: "00:01:22", source: "News Monitor KZ",        text: "No corroborating reporting — flagged as unconfirmed" },
  { time: "00:01:38", source: "Uploaded Case Files",    text: "Prior brief KZ-2041 matched on 2 entities" },
];

export const GENERATED_SUMMARY =
  "The system detected a spike in coordinated mentions across multiple simulated source types. Two entities appeared repeatedly across Telegram-style posts, public forum discussions, and OSINT feeds. Recommended next step: manual analyst review.";

export const KEY_FINDINGS = [
  "3 critical-risk entities identified within a single 90-second window.",
  "Cross-source correlation: 5 of 7 monitored sources reported overlapping signals.",
  "Two wallet/handle pairs match prior brief KZ-2041 with 84% confidence.",
  "Activity concentrated in after-hours window (22:00–02:00 local).",
  "42 duplicate signals removed — no evidence of coordinated amplification beyond observed cluster.",
];

export const NEXT_ACTIONS = [
  "Assign analyst review on cluster KZ-2048 within 4 hours.",
  "Request legal authorization for deep-source pull on Subject Alpha.",
  "Pin Subject Bravo and Subject Charlie to case board.",
  "Schedule re-scan in 6 hours with widened keyword set.",
];