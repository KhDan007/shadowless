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
    label: "Объект Альфа",
    alias: "@shadow_node",
    risk: "critical",
    riskScore: 92,
    confidence: 94,
    connections: 14,
    identifiers: [
      { label: "ПСЕВДОНИМ", value: "@shadow_node" },
      { label: "ДОК. ID", value: "KZ-IDX-7741-093A" },
      { label: "УСТРОЙСТВО", value: "fp:9a:e2:11:7c" },
    ],
    summary:
      "Основной узел, координирующий кросс-платформенную активность. Сопоставлен с четырьмя кластерами кошельков и тремя broadcast-каналами Telegram. Поведенческий паттерн совпадает с профилем операции «NORDWIND» (87%).",
    source: "OSINT + сбор Telegram",
    reliability: "A",
    lastSeen: "2026-06-24 14:22 UTC+5",
    evidence: [
      { id: "ev-2048-031", title: "Broadcast канала — «партия рассылки 04»", time: "14:22" },
      { id: "ev-2048-029", title: "Перевод кошелька 0,84 USDT → TRC-20 TX9z…8kLp", time: "13:51" },
      { id: "ev-2048-024", title: "Гео-кластер пингов — Алматы, Бостандык", time: "11:08" },
    ],
    riskFactors: [
      { label: "Всплеск скорости broadcast Telegram",     delta: 18, time: "14:22", source: "TG-CRAWL-04" },
      { label: "Пересечение кластера кошельков · KZ-FIU-118", delta: 14, time: "13:51", source: "CHAIN-TRC20" },
      { label: "Поведенческое совпадение · NORDWIND 87%", delta: 22, time: "19:47", source: "AI · profile-match" },
      { label: "Гео-кластер · Алматы, Бостандык",         delta:  9, time: "11:08", source: "GEO-PING" },
      { label: "Передача прав админа канала",             delta:  7, time: "14:13", source: "TG-CRAWL-04" },
      { label: "Базовый уровень · прежняя связь с NORDWIND", delta: 22, time: "—",   source: "OSINT-LAKE" },
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
      { label: "КАНАЛЫ", value: "3 broadcast / 2 приватных" },
    ],
    summary: "Идентификатор Telegram, связан с Объектом Альфа. Управляет 3 broadcast-каналами с синхронизированным временем публикаций.",
    source: "Сбор Telegram",
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
    identifiers: [{ label: "ФОРУМ", value: "darkkaz.onion / u/204" }],
    summary: "Репутационный аккаунт форума, выступает посредником в обмене кошельков внутри подозреваемого кластера.",
    source: "Tor-краулер / синтетический набор",
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
      { label: "СЕТЬ", value: "TRON / TRC-20" },
      { label: "АДРЕС", value: "TX9z4Pp7Qn2eR1uV6mZ8kLp" },
      { label: "ОБОРОТ 30Д", value: "184 221,40 USDT" },
    ],
    summary: "Высокообъёмный кошелёк, смежный с миксером. 11 входящих контрагентов совпадают с отмеченным кластером KZ-FIU-118.",
    source: "Аналитика блокчейна",
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
    identifiers: [{ label: "АДРЕС", value: "bc1qx0z9k…m4ah" }],
    summary: "Вторичный расчётный кошелёк, частичное пересечение с кластером.",
    source: "Аналитика блокчейна",
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
    identifiers: [{ label: "ОПЕРАТОР", value: "Kcell / предоплата" }],
    summary: "Одноразовая SIM, зарегистрирована 11 дней назад. Три события роуминга на подступах к Алматы.",
    source: "Метаданные сотового оператора (синт.)",
    reliability: "B",
    lastSeen: "2026-06-24 08:02 UTC+5",
    evidence: [],
  },
  {
    id: "e-loc",
    kind: "location",
    label: "Алматы — Бостандык",
    risk: "low",
    riskScore: 28,
    confidence: 64,
    connections: 5,
    identifiers: [{ label: "КООРД.", value: "43.2389° N, 76.8897° E" }],
    summary: "Повторяющийся гео-кластер по пингам устройств и KYC-артефактам кошельков.",
    source: "Гео-телеметрия",
    reliability: "C",
    lastSeen: "2026-06-24 11:08 UTC+5",
    evidence: [],
  },
  {
    id: "e-osint",
    kind: "osint",
    label: "OSINT-совпадение — Синт. набор",
    risk: "low",
    riskScore: 22,
    confidence: 58,
    connections: 2,
    identifiers: [{ label: "НАБОР", value: "synthetic-osint-2026Q2" }],
    summary: "Перекрёстное совпадение с синтетическим OSINT-корпусом. Используется только для валидации.",
    source: "Внутреннее OSINT-озеро",
    reliability: "D",
    lastSeen: "2026-06-22 17:30 UTC+5",
    evidence: [],
  },
];

export const CASES = [
  { id: "KZ-2048", title: "Расследование цифровой сети", risk: "critical" as RiskLevel, entities: 47 },
  { id: "KZ-2041", title: "Трансграничный кластер кошельков", risk: "high" as RiskLevel, entities: 22 },
  { id: "KZ-2036", title: "Сканирование репутации форумов", risk: "medium" as RiskLevel, entities: 14 },
  { id: "KZ-2029", title: "Аудит координации каналов", risk: "low" as RiskLevel, entities: 9 },
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
    collector: "TG-CRAWL-04 · сенсор №7",
    collectedAt: "2026-06-24 14:22:11 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Зафиксирован синхронизированный broadcast «партия рассылки 04» в трёх Telegram-каналах под управлением @shadow_node в окне 90 секунд. Темп публикаций соответствует «отпечатку» NORDWIND и повторно использует идентификаторы из EV-2048-007.",
    caseId: "KZ-2048",
    entityIds: ["e-tg", "e-alpha"],
    artifacts: [
      { kind: "screenshot", filename: "tg_broadcast_2026-06-24_1422.png", mime: "image/png", sizeKb: 412, sha256: "9a4f…e2c1" },
      { kind: "transcript", filename: "broadcast_batch_04.txt",          mime: "text/plain", sizeKb: 6,   sha256: "11de…77ab" },
      { kind: "metadata",   filename: "channel_meta.json",                mime: "application/json", sizeKb: 14, sha256: "82bc…0b91" },
    ],
    custody: [
      { ts: "2026-06-24 14:22", actor: "TG-CRAWL-04", action: "Получено", note: "Взято из очереди broadcast · TLS 1.3 · подписано сертификатом сенсора" },
      { ts: "2026-06-24 14:22", actor: "Конвейер · hasher-v3", action: "Хешировано", note: "SHA-256 по пакету артефактов" },
      { ts: "2026-06-24 14:24", actor: "AI-движок · corr-v4", action: "Скоррелировано", note: "Авто-связь с Объектом Альфа (уверенность 94%)" },
    ],
    tags: ["telegram", "broadcast", "паттерн-nordwind"],
  },
  "EV-2048-029": {
    collector: "Индексатор CHAIN-TRC20",
    collectedAt: "2026-06-24 13:51:48 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Исходящий перевод 0,84 USDT с TX9z…8kLp на сервисный контракт, смежный с известным миксером. Адрес контрагента отмечен двумя независимыми поставщиками chain-аналитики.",
    caseId: "KZ-2048",
    entityIds: ["e-w1", "e-alpha"],
    artifacts: [
      { kind: "transaction", filename: "tx_TX9z_outbound.json", mime: "application/json", sizeKb: 9, sha256: "4f2a…91cd" },
      { kind: "document",    filename: "vendor_attribution.pdf", mime: "application/pdf", sizeKb: 184, sha256: "ce10…44b7" },
    ],
    custody: [
      { ts: "2026-06-24 13:51", actor: "CHAIN-TRC20", action: "Получено" },
      { ts: "2026-06-24 13:52", actor: "Конвейер · hasher-v3", action: "Хешировано" },
      { ts: "2026-06-24 13:55", actor: "Аналитик Р. Беқсұлтан", action: "Просмотрено", note: "Отмечено к проверке · ждёт визы руководителя" },
    ],
    tags: ["кошелёк", "миксер", "trc-20"],
  },
  "EV-2048-024": {
    collector: "Агрегатор GEO-PING",
    collectedAt: "2026-06-24 11:08:02 UTC+5",
    reliability: "C",
    classification: "RESTRICTED",
    narrative:
      "Три пинга устройств в радиусе 80 м в Бостандыкском районе Алматы. Два из трёх отпечатков устройств ранее были связаны с Объектом Альфа.",
    caseId: "KZ-2048",
    entityIds: ["e-loc", "e-alpha"],
    artifacts: [
      { kind: "geo",      filename: "ping_cluster_bostandyk.geojson", mime: "application/geo+json", sizeKb: 22, sha256: "70ab…1f5e" },
      { kind: "metadata", filename: "fingerprint_overlap.csv",        mime: "text/csv",             sizeKb: 3,  sha256: "39ed…ac20" },
    ],
    custody: [
      { ts: "2026-06-24 11:08", actor: "GEO-PING", action: "Получено" },
      { ts: "2026-06-24 11:09", actor: "Конвейер · hasher-v3", action: "Хешировано" },
    ],
    tags: ["гео", "алматы", "отпечаток-устройства"],
  },
  "EV-2048-022": {
    collector: "Краулер TOR-FORUM",
    collectedAt: "2026-06-24 09:41:33 UTC+5",
    reliability: "B",
    classification: "RESTRICTED",
    narrative:
      "Репутационный аккаунт форума DarkKaz_204 разместил посредническое предложение по обмену кошельков в брокерской ветке. Формулировки пересекаются с предложениями, ранее связанными с кластером KZ-2048.",
    caseId: "KZ-2048",
    entityIds: ["e-forum"],
    artifacts: [
      { kind: "screenshot", filename: "forum_post_darkkaz_204.png", mime: "image/png", sizeKb: 318, sha256: "ab12…d8f0" },
      { kind: "transcript", filename: "post_body.txt",              mime: "text/plain", sizeKb: 2,  sha256: "5510…7e2b" },
    ],
    custody: [
      { ts: "2026-06-24 09:41", actor: "TOR-FORUM", action: "Получено" },
      { ts: "2026-06-24 09:42", actor: "Конвейер · hasher-v3", action: "Хешировано" },
      { ts: "2026-06-24 10:05", actor: "Аналитик Р. Беқсұлтан", action: "Подтверждено", note: "Подтверждена тревога AL-2048-022" },
    ],
    tags: ["tor", "форум", "брокер-оффер"],
  },
  "EV-2048-019": {
    collector: "Поток MNO-META",
    collectedAt: "2026-06-24 08:02:17 UTC+5",
    reliability: "B",
    classification: "RESTRICTED",
    narrative:
      "Одноразовая SIM +7 (701) 4•• ••91 в 08:02 сформировала событие роуминга у периметра Талгар. Совпадает с моделью перемещений последних двух недель.",
    caseId: "KZ-2048",
    entityIds: ["e-phone"],
    artifacts: [
      { kind: "metadata", filename: "roaming_event_0802.json", mime: "application/json", sizeKb: 5, sha256: "c2a8…f114" },
    ],
    custody: [
      { ts: "2026-06-24 08:02", actor: "MNO-META",  action: "Получено" },
      { ts: "2026-06-24 08:03", actor: "Конвейер · hasher-v3", action: "Хешировано" },
      { ts: "2026-06-24 08:30", actor: "Инсп. А. Тұрсынбек", action: "Подтверждено", note: "Шаблон совпадает с базовой моделью перемещений" },
    ],
    tags: ["mno", "одноразовая-sim", "роуминг"],
  },
  "EV-2048-015": {
    collector: "Индексатор CHAIN-BTC",
    collectedAt: "2026-06-23 22:10:55 UTC+5",
    reliability: "B",
    classification: "RESTRICTED",
    narrative:
      "Входящий перевод 0,012 BTC на расчётный кошелёк bc1q…m4ah. Адрес-источник отмечен в кластере KZ-FIU-118 у поставщика A и поставщика B.",
    caseId: "KZ-2048",
    entityIds: ["e-w2"],
    artifacts: [
      { kind: "transaction", filename: "tx_bc1q_inbound.json", mime: "application/json", sizeKb: 8, sha256: "7e44…309b" },
    ],
    custody: [
      { ts: "2026-06-23 22:10", actor: "CHAIN-BTC", action: "Получено" },
      { ts: "2026-06-23 22:11", actor: "Конвейер · hasher-v3", action: "Хешировано" },
    ],
    tags: ["кошелёк", "btc", "kz-fiu-118"],
  },
  "EV-2048-012": {
    collector: "Сопоставитель OSINT-LAKE",
    collectedAt: "2026-06-23 19:47:21 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Поведенческий отпечаток Объекта Альфа совпадает с архивным профилем операции «NORDWIND» с подобием 87%. Совпадение охватывает темп публикаций, ротацию каналов и лексические маркеры.",
    caseId: "KZ-2048",
    entityIds: ["e-alpha"],
    artifacts: [
      { kind: "document", filename: "nordwind_match_report.pdf", mime: "application/pdf", sizeKb: 612, sha256: "f01c…aa28" },
      { kind: "metadata", filename: "feature_vector.json",       mime: "application/json", sizeKb: 11, sha256: "2dd9…6c40" },
    ],
    custody: [
      { ts: "2026-06-23 19:47", actor: "OSINT-LAKE", action: "Получено" },
      { ts: "2026-06-23 19:48", actor: "AI-движок · profile-match", action: "Оценено", note: "Подобие 87% с архивом NORDWIND" },
      { ts: "2026-06-23 20:30", actor: "Аналитик Р. Беқсұлтан",     action: "Подтверждено" },
    ],
    tags: ["osint", "nordwind", "поведенческое"],
  },
  "EV-2048-009": {
    collector: "Сопоставитель OSINT-LAKE",
    collectedAt: "2026-06-23 17:30:09 UTC+5",
    reliability: "D",
    classification: "RESTRICTED",
    narrative:
      "Перекрёстная валидация по синтетическому OSINT-корпусу. Используется только как контрольный сигнал — без оперативного веса.",
    caseId: "KZ-2048",
    entityIds: ["e-osint"],
    artifacts: [
      { kind: "metadata", filename: "validation_pass.json", mime: "application/json", sizeKb: 4, sha256: "0ab7…4419" },
    ],
    custody: [
      { ts: "2026-06-23 17:30", actor: "OSINT-LAKE", action: "Получено" },
      { ts: "2026-06-23 17:31", actor: "Конвейер · hasher-v3", action: "Хешировано" },
      { ts: "2026-06-23 18:00", actor: "Аналитик М. Искаков", action: "Архивировано", note: "Контрольный сигнал · без оперативного веса" },
    ],
    tags: ["osint", "синтетика", "контроль"],
  },
  "EV-2048-007": {
    collector: "TG-CRAWL-04 · сенсор №7",
    collectedAt: "2026-06-23 14:12:44 UTC+5",
    reliability: "B",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "@shadow_node выдал права администратора двум недавно созданным суб-аккаунтам в трёх broadcast-каналах. Паттерн соответствует операционному распределению ролей.",
    caseId: "KZ-2048",
    entityIds: ["e-tg", "e-alpha"],
    artifacts: [
      { kind: "metadata",   filename: "admin_grant_events.json", mime: "application/json", sizeKb: 7,  sha256: "84e1…b3a2" },
      { kind: "screenshot", filename: "channel_admins.png",      mime: "image/png",        sizeKb: 226, sha256: "1d77…9050" },
    ],
    custody: [
      { ts: "2026-06-23 14:12", actor: "TG-CRAWL-04", action: "Получено" },
      { ts: "2026-06-23 14:13", actor: "Конвейер · hasher-v3", action: "Хешировано" },
      { ts: "2026-06-23 15:00", actor: "Аналитик Р. Беқсұлтан", action: "Просмотрено" },
    ],
    tags: ["telegram", "распределение-ролей"],
  },
  "EV-2048-003": {
    collector: "Индексатор CHAIN-TRC20",
    collectedAt: "2026-06-23 09:01:18 UTC+5",
    reliability: "A",
    classification: "RESTRICTED // MIA-INTERNAL",
    narrative:
      "Кошелёк TX9z…8kLp впервые замечен в сети. Первичное финансирование 12 400 USDT с горячего кошелька, помеченного как принадлежащий бирже. Задаёт базовую метку времени для расчётной ноги.",
    caseId: "KZ-2048",
    entityIds: ["e-w1"],
    artifacts: [
      { kind: "transaction", filename: "tx_TX9z_genesis.json", mime: "application/json", sizeKb: 6, sha256: "aa10…21fe" },
    ],
    custody: [
      { ts: "2026-06-23 09:01", actor: "CHAIN-TRC20", action: "Получено" },
      { ts: "2026-06-23 09:02", actor: "Конвейер · hasher-v3", action: "Хешировано" },
      { ts: "2026-06-23 09:30", actor: "Инсп. А. Тұрсынбек", action: "Подтверждено" },
    ],
    tags: ["кошелёк", "trc-20", "генезис"],
  },
};

export function getEvidenceDetail(id: string): EvidenceDetail | undefined {
  return EVIDENCE_DETAILS[id];
}

export const LOG_ROWS: LogRow[] = [
  { id: "EV-2048-031", time: "2026-06-24 14:22:11", source: "TG-CRAWL-04", entity: "@shadow_node", finding: "Broadcast «партия рассылки 04» в 3 каналах", confidence: 94, risk: "critical", status: "open" },
  { id: "EV-2048-029", time: "2026-06-24 13:51:48", source: "CHAIN-TRC20", entity: "TX9z…8kLp", finding: "Исходящие 0,84 USDT на отмеченный миксер", confidence: 97, risk: "critical", status: "review" },
  { id: "EV-2048-024", time: "2026-06-24 11:08:02", source: "GEO-PING", entity: "Алматы, Бостандык", finding: "Кластер пингов устройств в радиусе 80 м", confidence: 71, risk: "medium", status: "open" },
  { id: "EV-2048-022", time: "2026-06-24 09:41:33", source: "TOR-FORUM", entity: "DarkKaz_204", finding: "Размещён оффер обмена кошельков", confidence: 82, risk: "high", status: "review" },
  { id: "EV-2048-019", time: "2026-06-24 08:02:17", source: "MNO-META", entity: "+7 701 ••91", finding: "Роуминг одноразовой SIM, периметр Талгар", confidence: 69, risk: "medium", status: "validated" },
  { id: "EV-2048-015", time: "2026-06-23 22:10:55", source: "CHAIN-BTC", entity: "bc1q…m4ah", finding: "Входящие 0,012 BTC из кластера KZ-FIU-118", confidence: 74, risk: "medium", status: "open" },
  { id: "EV-2048-012", time: "2026-06-23 19:47:21", source: "OSINT-LAKE", entity: "Объект Альфа", finding: "Совпадение поведенческого профиля NORDWIND 87%", confidence: 87, risk: "high", status: "validated" },
  { id: "EV-2048-009", time: "2026-06-23 17:30:09", source: "OSINT-LAKE", entity: "Синт. набор", finding: "Перекрёстная валидация пройдена", confidence: 58, risk: "low", status: "archived" },
  { id: "EV-2048-007", time: "2026-06-23 14:12:44", source: "TG-CRAWL-04", entity: "@shadow_node", finding: "Права админа канала выданы 2 суб-аккаунтам", confidence: 81, risk: "high", status: "review" },
  { id: "EV-2048-003", time: "2026-06-23 09:01:18", source: "CHAIN-TRC20", entity: "TX9z…8kLp", finding: "Создан кошелёк — первичное финансирование 12 400 USDT", confidence: 99, risk: "high", status: "validated" },
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
  { id: "AL-2048-031", date: "2026-06-24", time: "14:22", level: "critical", entityId: "e-w1",    message: "Обнаружен перевод, смежный с миксером, на TX9z…8kLp", source: "CHAIN-TRC20", status: "unread" },
  { id: "AL-2048-029", date: "2026-06-24", time: "13:51", level: "high",     entityId: "e-tg",    message: "Синхронизация темпа каналов — 3 broadcast за 90 сек.", source: "TG-CRAWL-04", status: "unread" },
  { id: "AL-2048-024", date: "2026-06-24", time: "11:08", level: "medium",   entityId: "e-loc",   message: "Гео-кластер Алматы, Бостандык +3 пинга устройств",    source: "GEO-PING",    status: "unread" },
  { id: "AL-2048-022", date: "2026-06-24", time: "09:41", level: "high",     entityId: "e-forum", message: "Tor-форум DarkKaz_204 разместил брокерский оффер",     source: "TOR-FORUM",   status: "acked"  },
  { id: "AL-2048-019", date: "2026-06-24", time: "08:02", level: "medium",   entityId: "e-phone", message: "Событие роуминга одноразовой SIM у периметра Талгар",  source: "MNO-META",    status: "acked"  },
  { id: "AL-2048-015", date: "2026-06-23", time: "22:10", level: "medium",   entityId: "e-w2",    message: "Входящие 0,012 BTC из отмеченного кластера KZ-FIU-118", source: "CHAIN-BTC",   status: "acked"  },
  { id: "AL-2048-012", date: "2026-06-23", time: "19:47", level: "high",     entityId: "e-alpha", message: "Совпадение поведенческого профиля NORDWIND — 87%",      source: "OSINT-LAKE",  status: "acked"  },
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
    title: "Дело KZ-2048 · Еженедельная сводка",
    created: "2026-06-24 09:00",
    state: "validated",
    risk: "critical",
    pages: 18,
    caseId: "KZ-2048",
    author: "Инсп. А. Тұрсынбек · CIB-04",
    classification: "RESTRICTED // MIA-INTERNAL",
    summary:
      "За неделю кластер KZ-FIU-118 расширился на четыре узла. Основной подозреваемый узел «Объект Альфа» координирует кросс-платформенную активность, совпадающую с профилем операции «NORDWIND» (подобие 87%). Кошелёк TX9z…8kLp демонстрирует переводы, смежные с миксером, характерные для оперативных расчётов.",
    sections: [
      { heading: "Оперативная картина", body: "Объект Альфа (@shadow_node) управляет тремя broadcast-каналами Telegram с синхронизированным темпом и выступает посредником в обмене кошельков через Tor-форум DarkKaz_204. Два расчётных кошелька (TRC-20 и BTC) перемещают эквивалент 184 тыс. USDT за 30 дней. Одноразовая SIM и гео-кластер Алматы-Бостандык фиксируют физическое присутствие в радиусе 80 м." },
      { heading: "Резюме AI-вывода", body: "Поведенческий отпечаток совпадает с операцией «NORDWIND» с подобием 87%. Сила кросс-платформенной корреляции +6,2σ выше базового уровня. Уверенность по основному идентификатору подозреваемого (отпечаток устройства fp:9a:e2:11:7c) — 94%. 14 новых связей, выявленных моделью, ожидают проверки аналитика." },
      { heading: "Рекомендованные следующие шаги", body: "1) Подать запрос MLAT по расчётному TRC-20 кошельку TX9z…8kLp. 2) Расширить окно наблюдения за Tor-форумом с 7д → 30д. 3) Согласовать с алматинским оперативным подразделением сканирование отпечатков устройств по периметру. 4) Прогнать сравнение с NORDWIND по архиву 2024-Q3 для оценки непрерывности оператора." },
    ],
    entityIds: ["e-alpha", "e-tg", "e-w1", "e-w2", "e-forum", "e-phone", "e-loc"],
    evidenceIds: ["EV-2048-031", "EV-2048-029", "EV-2048-024", "EV-2048-022", "EV-2048-012"],
  },
  {
    id: "RPT-2048-013",
    title: "Глубокий разбор кластера кошельков KZ-FIU-118",
    created: "2026-06-23 17:42",
    state: "validated",
    risk: "critical",
    pages: 11,
    caseId: "KZ-2048",
    author: "Аналитик Р. Беқсұлтан",
    classification: "RESTRICTED // MIA-INTERNAL",
    summary:
      "Кластер KZ-FIU-118 сейчас содержит 11 входящих контрагентов к кошельку TX9z…8kLp. Поток, смежный с миксером, соответствует трансграничным расчётам.",
    sections: [
      { heading: "Аналитика блокчейна", body: "TRC-20 кошелёк TX9z…8kLp получил 11 входящих переводов с адресов, отмеченных в KZ-FIU-118, за 30 дней — суммарно 184 221,40 USDT. Исходящие пути ведут к двум сервисным контрактам, смежным с миксером." },
      { heading: "Оценка достоверности", body: "Источник отнесён к классу A (высокая надёжность) по классификации CIB. Атрибуция адресов подтверждена двумя независимыми поставщиками аналитики." },
    ],
    entityIds: ["e-w1", "e-w2", "e-alpha"],
    evidenceIds: ["EV-2048-029", "EV-2048-015"],
  },
  {
    id: "RPT-2041-007",
    title: "Трансграничная корреляция кошельков",
    created: "2026-06-22 14:10",
    state: "review",
    risk: "high",
    pages: 7,
    caseId: "KZ-2041",
    author: "Аналитик К. Омаров",
    classification: "RESTRICTED",
    summary: "Трансграничная корреляция кошельков по расчётным контрагентам дела KZ-2041.",
    sections: [
      { heading: "Находки", body: "Три адреса кошельков пересекаются с кластером KZ-2048. Рекомендуется совместный разбор." },
    ],
    entityIds: ["e-w1", "e-w2"],
    evidenceIds: ["EV-2048-015"],
  },
  {
    id: "RPT-2036-005",
    title: "Сводка сканирования репутации форумов",
    created: "2026-06-20 11:30",
    state: "review",
    risk: "medium",
    pages: 5,
    caseId: "KZ-2036",
    author: "Аналитик Д. Сағат",
    classification: "RESTRICTED",
    summary: "Ежеквартальное сканирование репутации по Tor-индексируемым брокерским форумам.",
    sections: [
      { heading: "Покрытие", body: "Проиндексировано 12 форумов, 184 репутационных аккаунта. Два пересекаются с кластером KZ-2048." },
    ],
    entityIds: ["e-forum"],
    evidenceIds: ["EV-2048-022"],
  },
  {
    id: "RPT-2029-002",
    title: "Аудит координации каналов",
    created: "2026-06-18 08:55",
    state: "archived",
    risk: "low",
    pages: 4,
    caseId: "KZ-2029",
    author: "Аналитик М. Искаков",
    classification: "RESTRICTED",
    summary: "Ежеквартальный аудит паттернов координации Telegram-каналов.",
    sections: [
      { heading: "Результат", body: "Новых паттернов координации выше базового уровня за квартал не выявлено." },
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

export const TIMELINE_EVENTS: TimelineEvent[] = [];
