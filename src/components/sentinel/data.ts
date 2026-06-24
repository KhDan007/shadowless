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

export const ENTITIES: SentinelEntity[] = [
  {
    id: "e-alpha",
    kind: "suspect",
    label: "Entity Alpha",
    alias: "@shadow_node",
    risk: "critical",
    riskScore: 92,
    confidence: 94,
    connections: 14,
    identifiers: [
      { label: "ALIAS", value: "@shadow_node" },
      { label: "DOC ID", value: "KZ-IDX-7741-093A" },
      { label: "DEVICE", value: "fp:9a:e2:11:7c" },
    ],
    summary:
      "Primary node coordinating cross-platform activity. Correlated to four wallet clusters and three Telegram broadcast channels. Behavioral pattern matches Operation NORDWIND profile (87%).",
    source: "OSINT + Telegram Crawl",
    reliability: "A",
    lastSeen: "2026-06-24 14:22 UTC+5",
    evidence: [
      { id: "ev-2048-031", title: "Channel broadcast — 'distribution batch 04'", time: "14:22" },
      { id: "ev-2048-029", title: "Wallet transfer 0.84 USDT → TRC-20 TX9z…8kLp", time: "13:51" },
      { id: "ev-2048-024", title: "Geo ping cluster — Almaty Bostandyk", time: "11:08" },
    ],
    riskFactors: [
      { label: "Telegram broadcast velocity spike",      delta: 18, time: "14:22", source: "TG-CRAWL-04" },
      { label: "Wallet cluster overlap · KZ-FIU-118",    delta: 14, time: "13:51", source: "CHAIN-TRC20" },
      { label: "Behavioral match · NORDWIND 87%",        delta: 22, time: "19:47", source: "AI · profile-match" },
      { label: "Geo cluster · Almaty Bostandyk",         delta:  9, time: "11:08", source: "GEO-PING" },
      { label: "Channel admin redistribution",           delta:  7, time: "14:13", source: "TG-CRAWL-04" },
      { label: "Baseline · prior NORDWIND association",  delta: 22, time: "—",     source: "OSINT-LAKE" },
    ],
  },
  {
    id: "e-tg",
    kind: "telegram",
    label: "@shadow_node",
    risk: "high",
    riskScore: 78,
    confidence: 88,
    connections: 9,
    identifiers: [
      { label: "TG ID", value: "tg://user?id=884412091" },
      { label: "CHANNELS", value: "3 broadcast / 2 private" },
    ],
    summary: "Telegram identity tied to Entity Alpha. Operates 3 broadcast channels with synchronized post timing.",
    source: "Telegram Crawl",
    reliability: "B",
    lastSeen: "2026-06-24 14:18 UTC+5",
    evidence: [],
  },
  {
    id: "e-forum",
    kind: "forum",
    label: "DarkKaz_204",
    risk: "high",
    riskScore: 71,
    confidence: 81,
    connections: 6,
    identifiers: [{ label: "FORUM", value: "darkkaz.onion / u/204" }],
    summary: "Forum reputation account brokering wallet exchange services across the suspect cluster.",
    source: "Tor crawler / synthetic dataset",
    reliability: "B",
    lastSeen: "2026-06-24 09:41 UTC+5",
    evidence: [],
  },
  {
    id: "e-w1",
    kind: "wallet",
    label: "TRC-20 TX9z…8kLp",
    risk: "critical",
    riskScore: 88,
    confidence: 97,
    connections: 11,
    identifiers: [
      { label: "CHAIN", value: "TRON / TRC-20" },
      { label: "ADDR", value: "TX9z4Pp7Qn2eR1uV6mZ8kLp" },
      { label: "VOL 30D", value: "184,221.40 USDT" },
    ],
    summary: "High-volume mixer-adjacent wallet. 11 inbound counterparties match flagged cluster KZ-FIU-118.",
    source: "Chain analytics",
    reliability: "A",
    lastSeen: "2026-06-24 13:51 UTC+5",
    evidence: [],
  },
  {
    id: "e-w2",
    kind: "wallet",
    label: "BTC bc1q…m4ah",
    risk: "medium",
    riskScore: 54,
    confidence: 72,
    connections: 4,
    identifiers: [{ label: "ADDR", value: "bc1qx0z9k…m4ah" }],
    summary: "Secondary settlement wallet, partial overlap with cluster.",
    source: "Chain analytics",
    reliability: "C",
    lastSeen: "2026-06-23 22:10 UTC+5",
    evidence: [],
  },
  {
    id: "e-phone",
    kind: "phone",
    label: "+7 (701) 4•• ••91",
    risk: "medium",
    riskScore: 47,
    confidence: 69,
    connections: 3,
    identifiers: [{ label: "CARRIER", value: "Kcell / prepaid" }],
    summary: "Burner SIM registered 11 days ago. Three roaming events near Almaty perimeter.",
    source: "MNO metadata (synthetic)",
    reliability: "B",
    lastSeen: "2026-06-24 08:02 UTC+5",
    evidence: [],
  },
  {
    id: "e-loc",
    kind: "location",
    label: "Almaty — Bostandyk",
    risk: "low",
    riskScore: 28,
    confidence: 64,
    connections: 5,
    identifiers: [{ label: "GRID", value: "43.2389° N, 76.8897° E" }],
    summary: "Recurrent geolocation cluster from device pings and wallet KYC artifacts.",
    source: "Geo telemetry",
    reliability: "C",
    lastSeen: "2026-06-24 11:08 UTC+5",
    evidence: [],
  },
  {
    id: "e-osint",
    kind: "osint",
    label: "OSINT Match — Synthetic DS",
    risk: "low",
    riskScore: 22,
    confidence: 58,
    connections: 2,
    identifiers: [{ label: "DATASET", value: "synthetic-osint-2026Q2" }],
    summary: "Cross-reference match against synthetic OSINT corpus. Used for validation only.",
    source: "Internal OSINT lake",
    reliability: "D",
    lastSeen: "2026-06-22 17:30 UTC+5",
    evidence: [],
  },
];

export const CASES = [
  { id: "KZ-2048", title: "Digital Network Investigation", risk: "critical" as RiskLevel, entities: 47 },
  { id: "KZ-2041", title: "Cross-border Wallet Cluster", risk: "high" as RiskLevel, entities: 22 },
  { id: "KZ-2036", title: "Forum Reputation Sweep", risk: "medium" as RiskLevel, entities: 14 },
  { id: "KZ-2029", title: "Channel Coordination Audit", risk: "low" as RiskLevel, entities: 9 },
];

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

export const EVIDENCE_DETAILS: Record<string, EvidenceDetail> = {
  "EV-2048-031": {
    collector: "TG-CRAWL-04 · sensor #7",
    collectedAt: "2026-06-24 14:22:11 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Synchronized broadcast 'distribution batch 04' captured across three Telegram channels operated by @shadow_node within a 90-second window. Posting cadence is consistent with the NORDWIND fingerprint and reuses identifier strings observed in EV-2048-007.",
    caseId: "KZ-2048",
    entityIds: ["e-tg", "e-alpha"],
    artifacts: [
      { kind: "screenshot", filename: "tg_broadcast_2026-06-24_1422.png", mime: "image/png", sizeKb: 412, sha256: "9a4f…e2c1" },
      { kind: "transcript", filename: "broadcast_batch_04.txt",          mime: "text/plain", sizeKb: 6,   sha256: "11de…77ab" },
      { kind: "metadata",   filename: "channel_meta.json",                mime: "application/json", sizeKb: 14, sha256: "82bc…0b91" },
    ],
    custody: [
      { ts: "2026-06-24 14:22", actor: "TG-CRAWL-04", action: "Ingested", note: "Pulled from broadcast queue · TLS 1.3 · signed by sensor cert" },
      { ts: "2026-06-24 14:22", actor: "Pipeline · hasher-v3", action: "Hashed", note: "SHA-256 over artifact bundle" },
      { ts: "2026-06-24 14:24", actor: "AI Engine · corr-v4", action: "Correlated", note: "Auto-linked to Entity Alpha (94% confidence)" },
    ],
    tags: ["telegram", "broadcast", "nordwind-pattern"],
  },
  "EV-2048-029": {
    collector: "CHAIN-TRC20 indexer",
    collectedAt: "2026-06-24 13:51:48 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Outbound 0.84 USDT transfer from TX9z…8kLp to a known mixer-adjacent service contract. Counterparty address is tagged across two independent chain-analytics vendors.",
    caseId: "KZ-2048",
    entityIds: ["e-w1", "e-alpha"],
    artifacts: [
      { kind: "transaction", filename: "tx_TX9z_outbound.json", mime: "application/json", sizeKb: 9, sha256: "4f2a…91cd" },
      { kind: "document",    filename: "vendor_attribution.pdf", mime: "application/pdf", sizeKb: 184, sha256: "ce10…44b7" },
    ],
    custody: [
      { ts: "2026-06-24 13:51", actor: "CHAIN-TRC20", action: "Ingested" },
      { ts: "2026-06-24 13:52", actor: "Pipeline · hasher-v3", action: "Hashed" },
      { ts: "2026-06-24 13:55", actor: "Analyst R. Beksultan", action: "Reviewed", note: "Marked for review · pending supervisor sign-off" },
    ],
    tags: ["wallet", "mixer", "trc-20"],
  },
  "EV-2048-024": {
    collector: "GEO-PING aggregator",
    collectedAt: "2026-06-24 11:08:02 UTC+5",
    reliability: "C",
    classification: "RESTRICTED",
    narrative:
      "Three device pings co-located inside an 80m radius in Almaty Bostandyk district. Two of the three device fingerprints have been previously associated with Entity Alpha.",
    caseId: "KZ-2048",
    entityIds: ["e-loc", "e-alpha"],
    artifacts: [
      { kind: "geo",      filename: "ping_cluster_bostandyk.geojson", mime: "application/geo+json", sizeKb: 22, sha256: "70ab…1f5e" },
      { kind: "metadata", filename: "fingerprint_overlap.csv",        mime: "text/csv",             sizeKb: 3,  sha256: "39ed…ac20" },
    ],
    custody: [
      { ts: "2026-06-24 11:08", actor: "GEO-PING", action: "Ingested" },
      { ts: "2026-06-24 11:09", actor: "Pipeline · hasher-v3", action: "Hashed" },
    ],
    tags: ["geo", "almaty", "device-fingerprint"],
  },
  "EV-2048-022": {
    collector: "TOR-FORUM crawler",
    collectedAt: "2026-06-24 09:41:33 UTC+5",
    reliability: "B",
    classification: "RESTRICTED",
    narrative:
      "Forum reputation account DarkKaz_204 posted a wallet-exchange brokerage offer in the broker thread. Wording overlaps with offers previously linked to the KZ-2048 cluster.",
    caseId: "KZ-2048",
    entityIds: ["e-forum"],
    artifacts: [
      { kind: "screenshot", filename: "forum_post_darkkaz_204.png", mime: "image/png", sizeKb: 318, sha256: "ab12…d8f0" },
      { kind: "transcript", filename: "post_body.txt",              mime: "text/plain", sizeKb: 2,  sha256: "5510…7e2b" },
    ],
    custody: [
      { ts: "2026-06-24 09:41", actor: "TOR-FORUM", action: "Ingested" },
      { ts: "2026-06-24 09:42", actor: "Pipeline · hasher-v3", action: "Hashed" },
      { ts: "2026-06-24 10:05", actor: "Analyst R. Beksultan", action: "Acknowledged", note: "Acked alert AL-2048-022" },
    ],
    tags: ["tor", "forum", "broker-offer"],
  },
  "EV-2048-019": {
    collector: "MNO-META feed",
    collectedAt: "2026-06-24 08:02:17 UTC+5",
    reliability: "B",
    classification: "RESTRICTED",
    narrative:
      "Burner SIM +7 (701) 4•• ••91 generated a roaming event near the Talgar perimeter at 08:02. Matches commute pattern observed across two prior weeks.",
    caseId: "KZ-2048",
    entityIds: ["e-phone"],
    artifacts: [
      { kind: "metadata", filename: "roaming_event_0802.json", mime: "application/json", sizeKb: 5, sha256: "c2a8…f114" },
    ],
    custody: [
      { ts: "2026-06-24 08:02", actor: "MNO-META",  action: "Ingested" },
      { ts: "2026-06-24 08:03", actor: "Pipeline · hasher-v3", action: "Hashed" },
      { ts: "2026-06-24 08:30", actor: "Insp. A. Tursynbek", action: "Validated", note: "Pattern matches commute baseline" },
    ],
    tags: ["mno", "burner-sim", "roaming"],
  },
  "EV-2048-015": {
    collector: "CHAIN-BTC indexer",
    collectedAt: "2026-06-23 22:10:55 UTC+5",
    reliability: "B",
    classification: "RESTRICTED",
    narrative:
      "Inbound 0.012 BTC into settlement wallet bc1q…m4ah. Originating address is tagged within cluster KZ-FIU-118 at vendor A and vendor B.",
    caseId: "KZ-2048",
    entityIds: ["e-w2"],
    artifacts: [
      { kind: "transaction", filename: "tx_bc1q_inbound.json", mime: "application/json", sizeKb: 8, sha256: "7e44…309b" },
    ],
    custody: [
      { ts: "2026-06-23 22:10", actor: "CHAIN-BTC", action: "Ingested" },
      { ts: "2026-06-23 22:11", actor: "Pipeline · hasher-v3", action: "Hashed" },
    ],
    tags: ["wallet", "btc", "kz-fiu-118"],
  },
  "EV-2048-012": {
    collector: "OSINT-LAKE matcher",
    collectedAt: "2026-06-23 19:47:21 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Behavioral fingerprint of Entity Alpha matches the archived Operation NORDWIND profile at 87% similarity. Match covers posting cadence, channel rotation, and lexical markers.",
    caseId: "KZ-2048",
    entityIds: ["e-alpha"],
    artifacts: [
      { kind: "document", filename: "nordwind_match_report.pdf", mime: "application/pdf", sizeKb: 612, sha256: "f01c…aa28" },
      { kind: "metadata", filename: "feature_vector.json",       mime: "application/json", sizeKb: 11, sha256: "2dd9…6c40" },
    ],
    custody: [
      { ts: "2026-06-23 19:47", actor: "OSINT-LAKE", action: "Ingested" },
      { ts: "2026-06-23 19:48", actor: "AI Engine · profile-match", action: "Scored", note: "87% similarity vs NORDWIND archive" },
      { ts: "2026-06-23 20:30", actor: "Analyst R. Beksultan",      action: "Validated" },
    ],
    tags: ["osint", "nordwind", "behavioral"],
  },
  "EV-2048-009": {
    collector: "OSINT-LAKE matcher",
    collectedAt: "2026-06-23 17:30:09 UTC+5",
    reliability: "D",
    classification: "RESTRICTED",
    narrative:
      "Cross-reference validation pass against the synthetic OSINT corpus. Used only as a control signal — no operational weight.",
    caseId: "KZ-2048",
    entityIds: ["e-osint"],
    artifacts: [
      { kind: "metadata", filename: "validation_pass.json", mime: "application/json", sizeKb: 4, sha256: "0ab7…4419" },
    ],
    custody: [
      { ts: "2026-06-23 17:30", actor: "OSINT-LAKE", action: "Ingested" },
      { ts: "2026-06-23 17:31", actor: "Pipeline · hasher-v3", action: "Hashed" },
      { ts: "2026-06-23 18:00", actor: "Analyst M. Iskakov", action: "Archived", note: "Control signal · no operational weight" },
    ],
    tags: ["osint", "synthetic", "control"],
  },
  "EV-2048-007": {
    collector: "TG-CRAWL-04 · sensor #7",
    collectedAt: "2026-06-23 14:12:44 UTC+5",
    reliability: "B",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "@shadow_node granted channel admin to two newly-created sub-accounts across three broadcast channels. Pattern is consistent with operational role distribution.",
    caseId: "KZ-2048",
    entityIds: ["e-tg", "e-alpha"],
    artifacts: [
      { kind: "metadata",   filename: "admin_grant_events.json", mime: "application/json", sizeKb: 7,  sha256: "84e1…b3a2" },
      { kind: "screenshot", filename: "channel_admins.png",      mime: "image/png",        sizeKb: 226, sha256: "1d77…9050" },
    ],
    custody: [
      { ts: "2026-06-23 14:12", actor: "TG-CRAWL-04", action: "Ingested" },
      { ts: "2026-06-23 14:13", actor: "Pipeline · hasher-v3", action: "Hashed" },
      { ts: "2026-06-23 15:00", actor: "Analyst R. Beksultan", action: "Reviewed" },
    ],
    tags: ["telegram", "role-distribution"],
  },
  "EV-2048-003": {
    collector: "CHAIN-TRC20 indexer",
    collectedAt: "2026-06-23 09:01:18 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Wallet TX9z…8kLp first-seen on chain. Initial funding 12,400 USDT from an exchange-tagged hot wallet. Establishes baseline timestamp for the settlement leg.",
    caseId: "KZ-2048",
    entityIds: ["e-w1"],
    artifacts: [
      { kind: "transaction", filename: "tx_TX9z_genesis.json", mime: "application/json", sizeKb: 6, sha256: "aa10…21fe" },
    ],
    custody: [
      { ts: "2026-06-23 09:01", actor: "CHAIN-TRC20", action: "Ingested" },
      { ts: "2026-06-23 09:02", actor: "Pipeline · hasher-v3", action: "Hashed" },
      { ts: "2026-06-23 09:30", actor: "Insp. A. Tursynbek", action: "Validated" },
    ],
    tags: ["wallet", "trc-20", "genesis"],
  },
};

export function getEvidenceDetail(id: string): EvidenceDetail | undefined {
  return EVIDENCE_DETAILS[id];
}

export const LOG_ROWS: LogRow[] = [
  { id: "EV-2048-031", time: "2026-06-24 14:22:11", source: "TG-CRAWL-04", entity: "@shadow_node", finding: "Broadcast 'distribution batch 04' across 3 channels", confidence: 94, risk: "critical", status: "open" },
  { id: "EV-2048-029", time: "2026-06-24 13:51:48", source: "CHAIN-TRC20", entity: "TX9z…8kLp", finding: "Outbound 0.84 USDT to flagged mixer", confidence: 97, risk: "critical", status: "review" },
  { id: "EV-2048-024", time: "2026-06-24 11:08:02", source: "GEO-PING", entity: "Almaty Bostandyk", finding: "Device cluster ping within 80m radius", confidence: 71, risk: "medium", status: "open" },
  { id: "EV-2048-022", time: "2026-06-24 09:41:33", source: "TOR-FORUM", entity: "DarkKaz_204", finding: "Posted wallet exchange offer", confidence: 82, risk: "high", status: "review" },
  { id: "EV-2048-019", time: "2026-06-24 08:02:17", source: "MNO-META", entity: "+7 701 ••91", finding: "Burner SIM roaming event Talgar perimeter", confidence: 69, risk: "medium", status: "validated" },
  { id: "EV-2048-015", time: "2026-06-23 22:10:55", source: "CHAIN-BTC", entity: "bc1q…m4ah", finding: "Inbound 0.012 BTC from cluster KZ-FIU-118", confidence: 74, risk: "medium", status: "open" },
  { id: "EV-2048-012", time: "2026-06-23 19:47:21", source: "OSINT-LAKE", entity: "Entity Alpha", finding: "Behavioral profile match NORDWIND 87%", confidence: 87, risk: "high", status: "validated" },
  { id: "EV-2048-009", time: "2026-06-23 17:30:09", source: "OSINT-LAKE", entity: "Synthetic DS", finding: "Cross-reference validation pass", confidence: 58, risk: "low", status: "archived" },
  { id: "EV-2048-007", time: "2026-06-23 14:12:44", source: "TG-CRAWL-04", entity: "@shadow_node", finding: "Channel admin role granted to 2 sub-accounts", confidence: 81, risk: "high", status: "review" },
  { id: "EV-2048-003", time: "2026-06-23 09:01:18", source: "CHAIN-TRC20", entity: "TX9z…8kLp", finding: "Wallet created — initial funding 12,400 USDT", confidence: 99, risk: "high", status: "validated" },
];

export const CONFIDENCE_TREND = Array.from({ length: 18 }, (_, i) => ({
  t: i,
  conf: Math.round(55 + Math.sin(i / 2.4) * 10 + i * 1.4),
  risk: Math.round(40 + Math.cos(i / 3) * 8 + i * 1.1),
}));

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

export const ALERTS: AlertRow[] = [
  { id: "AL-2048-031", date: "2026-06-24", time: "14:22", level: "critical", entityId: "e-w1",    message: "Mixer-adjacent transfer detected on TX9z…8kLp", source: "CHAIN-TRC20", status: "unread" },
  { id: "AL-2048-029", date: "2026-06-24", time: "13:51", level: "high",     entityId: "e-tg",    message: "Channel cadence sync — 3 broadcasts within 90s",   source: "TG-CRAWL-04", status: "unread" },
  { id: "AL-2048-024", date: "2026-06-24", time: "11:08", level: "medium",   entityId: "e-loc",   message: "Geo cluster Almaty Bostandyk +3 device pings",     source: "GEO-PING",    status: "unread" },
  { id: "AL-2048-022", date: "2026-06-24", time: "09:41", level: "high",     entityId: "e-forum", message: "Tor forum DarkKaz_204 posted broker offer",         source: "TOR-FORUM",   status: "acked"  },
  { id: "AL-2048-019", date: "2026-06-24", time: "08:02", level: "medium",   entityId: "e-phone", message: "Burner SIM roaming event near Talgar perimeter",    source: "MNO-META",    status: "acked"  },
  { id: "AL-2048-015", date: "2026-06-23", time: "22:10", level: "medium",   entityId: "e-w2",    message: "Inbound 0.012 BTC from flagged cluster KZ-FIU-118",  source: "CHAIN-BTC",   status: "acked"  },
  { id: "AL-2048-012", date: "2026-06-23", time: "19:47", level: "high",     entityId: "e-alpha", message: "Behavioral profile match NORDWIND — 87% similarity", source: "OSINT-LAKE",  status: "acked"  },
];

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

export const REPORTS: Report[] = [
  {
    id: "RPT-2048-014",
    title: "Case KZ-2048 · Weekly briefing",
    created: "2026-06-24 09:00",
    state: "validated",
    risk: "critical",
    pages: 18,
    caseId: "KZ-2048",
    author: "Insp. A. Tursynbek · CIB-04",
    classification: "RESTRICTED // MIA-INTERNAL",
    summary:
      "Cluster KZ-FIU-118 expanded by four nodes this week. Primary suspect node 'Entity Alpha' coordinates cross-platform activity matching Operation NORDWIND profile (87% similarity). Wallet TX9z…8kLp shows mixer-adjacent transfers consistent with operational settlement.",
    sections: [
      { heading: "Operational picture", body: "Entity Alpha (@shadow_node) operates three Telegram broadcast channels with synchronized cadence and brokers wallet exchange through Tor forum DarkKaz_204. Two settlement wallets (TRC-20 and BTC) move 184k USDT-equivalent across 30 days. Burner SIM and Almaty-Bostandyk geo cluster co-locate physical presence within an 80m radius." },
      { heading: "AI inference summary", body: "Behavioural fingerprint matches Operation NORDWIND at 87% similarity. Cross-platform correlation strength +6.2σ above baseline. Confidence on the primary suspect identifier (device fingerprint fp:9a:e2:11:7c) is 94%. 14 new model-detected links pending analyst review." },
      { heading: "Recommended next steps", body: "1) Open MLAT request on TRC-20 settlement wallet TX9z…8kLp. 2) Escalate Tor forum surveillance window from 7d → 30d. 3) Coordinate with Almaty operational unit for perimeter device-fingerprint sweep. 4) Run NORDWIND comparison against archive 2024-Q3 to estimate operator continuity." },
    ],
    entityIds: ["e-alpha", "e-tg", "e-w1", "e-w2", "e-forum", "e-phone", "e-loc"],
    evidenceIds: ["EV-2048-031", "EV-2048-029", "EV-2048-024", "EV-2048-022", "EV-2048-012"],
  },
  {
    id: "RPT-2048-013",
    title: "Wallet cluster KZ-FIU-118 deep dive",
    created: "2026-06-23 17:42",
    state: "validated",
    risk: "critical",
    pages: 11,
    caseId: "KZ-2048",
    author: "Analyst R. Beksultan",
    classification: "RESTRICTED // MIA-INTERNAL",
    summary:
      "Cluster KZ-FIU-118 currently contains 11 inbound counterparties to wallet TX9z…8kLp. Mixer-adjacent flow consistent with cross-border settlement.",
    sections: [
      { heading: "Chain analytics", body: "TRC-20 wallet TX9z…8kLp received 11 inbound transfers from addresses tagged within KZ-FIU-118 across 30 days, totalling 184,221.40 USDT. Outbound paths lead to two mixer-adjacent service contracts." },
      { heading: "Reliability assessment", body: "Source rated A (high reliability) per CIB classification. Address attribution validated by two independent analytics vendors." },
    ],
    entityIds: ["e-w1", "e-w2", "e-alpha"],
    evidenceIds: ["EV-2048-029", "EV-2048-015"],
  },
  {
    id: "RPT-2041-007",
    title: "Cross-border wallet correlation",
    created: "2026-06-22 14:10",
    state: "review",
    risk: "high",
    pages: 7,
    caseId: "KZ-2041",
    author: "Analyst K. Omarov",
    classification: "RESTRICTED",
    summary: "Cross-border wallet correlation across KZ-2041 settlement counterparties.",
    sections: [
      { heading: "Findings", body: "Three wallet addresses overlap with KZ-2048 cluster. Recommend joint review." },
    ],
    entityIds: ["e-w1", "e-w2"],
    evidenceIds: ["EV-2048-015"],
  },
  {
    id: "RPT-2036-005",
    title: "Forum reputation sweep summary",
    created: "2026-06-20 11:30",
    state: "review",
    risk: "medium",
    pages: 5,
    caseId: "KZ-2036",
    author: "Analyst D. Sagat",
    classification: "RESTRICTED",
    summary: "Quarterly reputation sweep across Tor-indexed broker forums.",
    sections: [
      { heading: "Coverage", body: "Indexed 12 forums, 184 reputation accounts. Two intersect with the KZ-2048 cluster." },
    ],
    entityIds: ["e-forum"],
    evidenceIds: ["EV-2048-022"],
  },
  {
    id: "RPT-2029-002",
    title: "Channel coordination audit",
    created: "2026-06-18 08:55",
    state: "archived",
    risk: "low",
    pages: 4,
    caseId: "KZ-2029",
    author: "Analyst M. Iskakov",
    classification: "RESTRICTED",
    summary: "Quarterly audit of Telegram channel coordination patterns.",
    sections: [
      { heading: "Result", body: "No new coordination patterns above baseline this quarter." },
    ],
    entityIds: ["e-tg"],
    evidenceIds: [],
  },
];

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

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "TL-2048-001",
    ts: "2026-06-18T09:14:00+05:00", date: "2026-06-18", time: "09:14",
    kind: "case", risk: "high",
    title: "Case KZ-2048 opened",
    detail: "Digital Network Investigation initiated after tip-off from FIU cross-border desk. Initial scope: 2 wallets, 1 Telegram handle.",
    actor: "Insp. A. Tursynbek · CIB-04",
    caseId: "KZ-2048",
    entityIds: ["e-alpha", "e-w1"],
    pinned: true,
  },
  {
    id: "TL-2048-002",
    ts: "2026-06-19T11:02:00+05:00", date: "2026-06-19", time: "11:02",
    kind: "evidence", risk: "medium",
    title: "Telegram crawl seeded",
    detail: "Started TG-CRAWL-04 collection window against @shadow_node and 3 broadcast channels.",
    actor: "TG-CRAWL-04",
    caseId: "KZ-2048",
    entityIds: ["e-tg"],
  },
  {
    id: "TL-2048-003",
    ts: "2026-06-20T15:48:00+05:00", date: "2026-06-20", time: "15:48",
    kind: "ai", risk: "high",
    title: "Cluster expansion detected",
    detail: "Model linked 4 inbound counterparties of TX9z…8kLp to existing cluster KZ-FIU-118 (+6.2σ above baseline).",
    actor: "AI Engine · corr-v4",
    caseId: "KZ-2048",
    entityIds: ["e-w1", "e-alpha"],
    evidenceIds: ["EV-2048-003"],
  },
  {
    id: "TL-2048-004",
    ts: "2026-06-22T14:10:00+05:00", date: "2026-06-22", time: "14:10",
    kind: "report",
    title: "Report drafted · Cross-border wallet correlation",
    detail: "Analyst K. Omarov drafted RPT-2041-007 for joint review with case KZ-2041.",
    actor: "Analyst K. Omarov",
    caseId: "KZ-2048",
    reportId: "RPT-2041-007",
    entityIds: ["e-w1", "e-w2"],
  },
  {
    id: "TL-2048-005",
    ts: "2026-06-23T09:01:00+05:00", date: "2026-06-23", time: "09:01",
    kind: "evidence", risk: "high",
    title: "Wallet TX9z…8kLp · initial funding logged",
    detail: "Chain analytics recorded the wallet's first inbound: 12,400 USDT. Confidence 99%.",
    actor: "CHAIN-TRC20",
    caseId: "KZ-2048",
    entityIds: ["e-w1"],
    evidenceIds: ["EV-2048-003"],
  },
  {
    id: "TL-2048-006",
    ts: "2026-06-23T19:47:00+05:00", date: "2026-06-23", time: "19:47",
    kind: "ai", risk: "high",
    title: "Behavioral match · Operation NORDWIND 87%",
    detail: "Posting cadence and channel rotation pattern of Entity Alpha matches archived NORDWIND fingerprint at 87% similarity.",
    actor: "AI Engine · profile-match",
    caseId: "KZ-2048",
    entityIds: ["e-alpha"],
    evidenceIds: ["EV-2048-012"],
  },
  {
    id: "TL-2048-007",
    ts: "2026-06-23T20:30:00+05:00", date: "2026-06-23", time: "20:30",
    kind: "note",
    title: "Analyst note · escalation candidate",
    detail: "Recommend escalating Entity Alpha to PRIMARY SUSPECT pending wallet-side validation. Looping in Almaty operational unit.",
    actor: "Analyst R. Beksultan",
    caseId: "KZ-2048",
    entityIds: ["e-alpha"],
    pinned: true,
  },
  {
    id: "TL-2048-008",
    ts: "2026-06-23T22:10:00+05:00", date: "2026-06-23", time: "22:10",
    kind: "alert", risk: "medium",
    title: "Alert · inbound 0.012 BTC from KZ-FIU-118",
    detail: "Settlement wallet bc1q…m4ah received funds from flagged cluster.",
    actor: "CHAIN-BTC",
    caseId: "KZ-2048",
    entityIds: ["e-w2"],
    evidenceIds: ["EV-2048-015"],
  },
  {
    id: "TL-2048-009",
    ts: "2026-06-24T08:02:00+05:00", date: "2026-06-24", time: "08:02",
    kind: "evidence", risk: "medium",
    title: "Burner SIM roaming · Talgar perimeter",
    detail: "MNO metadata shows roaming event consistent with movement along Talgar perimeter.",
    actor: "MNO-META",
    caseId: "KZ-2048",
    entityIds: ["e-phone"],
    evidenceIds: ["EV-2048-019"],
  },
  {
    id: "TL-2048-010",
    ts: "2026-06-24T09:00:00+05:00", date: "2026-06-24", time: "09:00",
    kind: "report",
    title: "Weekly briefing report published",
    detail: "RPT-2048-014 validated and distributed to CIB-04 leadership. 18 pages, classification RESTRICTED // MIA-INTERNAL.",
    actor: "Insp. A. Tursynbek · CIB-04",
    caseId: "KZ-2048",
    reportId: "RPT-2048-014",
    entityIds: ["e-alpha", "e-w1", "e-tg"],
    pinned: true,
  },
  {
    id: "TL-2048-011",
    ts: "2026-06-24T09:41:00+05:00", date: "2026-06-24", time: "09:41",
    kind: "alert", risk: "high",
    title: "Alert · Tor forum broker offer",
    detail: "DarkKaz_204 posted a wallet-exchange offer matching cluster signature.",
    actor: "TOR-FORUM",
    caseId: "KZ-2048",
    entityIds: ["e-forum"],
    evidenceIds: ["EV-2048-022"],
  },
  {
    id: "TL-2048-012",
    ts: "2026-06-24T10:05:00+05:00", date: "2026-06-24", time: "10:05",
    kind: "ack",
    title: "Alert acknowledged · Tor forum broker offer",
    detail: "Analyst acknowledged AL-2048-022 and flagged for surveillance window extension.",
    actor: "Analyst R. Beksultan",
    caseId: "KZ-2048",
    entityIds: ["e-forum"],
  },
  {
    id: "TL-2048-013",
    ts: "2026-06-24T11:08:00+05:00", date: "2026-06-24", time: "11:08",
    kind: "evidence", risk: "medium",
    title: "Geo cluster · Almaty Bostandyk",
    detail: "Three device pings within an 80m radius co-located in Bostandyk district.",
    actor: "GEO-PING",
    caseId: "KZ-2048",
    entityIds: ["e-loc"],
    evidenceIds: ["EV-2048-024"],
  },
  {
    id: "TL-2048-014",
    ts: "2026-06-24T13:51:00+05:00", date: "2026-06-24", time: "13:51",
    kind: "alert", risk: "critical",
    title: "Alert · mixer-adjacent transfer on TX9z…8kLp",
    detail: "Outbound 0.84 USDT to a known mixer-adjacent service contract.",
    actor: "CHAIN-TRC20",
    caseId: "KZ-2048",
    entityIds: ["e-w1"],
    evidenceIds: ["EV-2048-029"],
  },
  {
    id: "TL-2048-015",
    ts: "2026-06-24T14:00:00+05:00", date: "2026-06-24", time: "14:00",
    kind: "action", risk: "high",
    title: "Action queued · MLAT request drafted",
    detail: "Draft MLAT request prepared for cross-border tracing of TRC-20 settlement wallet. Pending supervisor sign-off.",
    actor: "Insp. A. Tursynbek · CIB-04",
    caseId: "KZ-2048",
    entityIds: ["e-w1"],
    pinned: true,
  },
  {
    id: "TL-2048-016",
    ts: "2026-06-24T14:22:00+05:00", date: "2026-06-24", time: "14:22",
    kind: "evidence", risk: "critical",
    title: "Broadcast · 'distribution batch 04'",
    detail: "Synchronized broadcast across 3 Telegram channels within 90 seconds.",
    actor: "TG-CRAWL-04",
    caseId: "KZ-2048",
    entityIds: ["e-tg", "e-alpha"],
    evidenceIds: ["EV-2048-031"],
  },
];