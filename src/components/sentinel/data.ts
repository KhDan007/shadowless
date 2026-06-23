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