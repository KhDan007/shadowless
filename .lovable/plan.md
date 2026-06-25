# Привести фронтенд в соответствие с полным контрактом бэкенда

Документ описывает приложение «с нуля» (slate/blue/Inter, только тёмная тема), но проект уже построен в направлении **Bureau** (amber‑акцент, JetBrains Mono, dual theme, семантические токены) — это зафиксировано в core‑памяти и нарушать нельзя. Поэтому план не переписывает UI, а **дотягивает интеграцию с API** до полного объёма схем из документа: типы, мапперы, недостающие эндпоинты, реальное досье/сигналы/отчёты/прогресс задач. Все новые экраны используют существующие токены и компоненты (`PageShell`, `cn`, sonner, JetBrains Mono).

## 1. `src/lib/sentinelApi.ts` — расширить типы и мапперы
- Добавить полные интерфейсы по спецификации:
  - `ApiNode.data.properties`: `confidence`, `reliability`, `risk_factors[]`, `aliases[]`, `first_seen`, `last_seen`, `entities`, `evidence[].{id,source,source_url,time,snippet,match}`.
  - `ApiEdge.data`: `relation_type`, `confidence`, `weight: "high"|"med"|"low"`, `evidence_ids[]`, `first_seen`, `last_seen`.
  - `StatsResponse`: добавить `signals_per_hour: {hour,count}[]`, `risk_distribution: Record<string,number>`, `top_sources: {source,count}[]`.
  - `TaskStatusResponse`: `current_step`, `progress`, `eta_seconds`, `steps[]`.
  - `DossierResponse`: `evidence_refs[]`, `timeline[]`, `confidence`, `generated_at`, `model_version`.
  - Новые: `SignalResponse`, `EvidenceDetailResponse`, `ReportCreateRequest`, `ReportsResponse`.
- В `mapApiGraph` перестать хардкодить `confidence = 80`: брать `e.data.confidence`/`weight` из API; пробрасывать `relation_type` в `LiveEdge` (расширить тип до объекта `{from,to,weight,confidence,relation,evidenceIds}` с обратной совместимостью — кортеж оставить как алиас, добавить поле `meta`).
- В сущности сохранять: `risk_factors`, `evidence` с реальными `id/source/source_url/time/snippet`, `aliases`, `first_seen/last_seen`, `confidence` из API, `reliability` из API.
- Новые функции:
  - `fetchSignals(investigationId, riskFilter?)`
  - `fetchEvidence(evidenceId)`
  - `createReport(investigationId, title)` / `fetchReports(investigationId)`
  - `fetchTask` — вернуть полный `TaskStatusResponse`.

## 2. Реальное досье в `DetailPanel.tsx` и `/dossier/$id`
- Использовать новые поля: показывать `evidence_refs` карточками (snippet, source, time, confidence badge) с кнопкой «Открыть улику» → модалка с `fetchEvidence`.
- `timeline` — добавить вертикальный таймлайн (используем существующий `Timeline.tsx` шаблон).
- В подвале — кнопка «Скачать отчёт»: `createReport` → toast + список `fetchReports`.
- Никаких новых цветов: HIGH/MEDIUM/LOW → существующие `--risk-*` токены (amber‑ramp; CRITICAL = единственный `#b91c1c`). Не вводим green=good.

## 3. Прогресс задачи (Investigation)
- В `ScanControl`/`HintStrip` показывать `current_step`, `progress %`, `eta_seconds` и стэппер `steps[]` (queued → collecting → extracting → llm_enrichment → completed) — пока scan активен, опрос `fetchTask` каждые 2 сек, граф `fetchGraph` каждые 3 сек (как и сейчас, но останавливать на `done|error`).
- Стилистика — терминальная, JetBrains Mono, hairline rules, без glow.

## 4. Дашборд (route `/`) — реальные графики
- Когда `fetchStats()` возвращает `risk_distribution` и `signals_per_hour`, использовать их в существующих recharts блоках вместо `RISK_TIMELINE`/`SOURCE_DISTRIBUTION` (с fallback на мок).
- `top_sources` → блок «Источники» (если присутствует).
- Все цвета — через токены, без `#2563eb` и зелёного из документа.

## 5. Новый маршрут `/signals`
- Файл `src/routes/signals.tsx` (`createFileRoute("/signals")`), под `PageShell`.
- Таблица: time / source / finding / risk badge / status; фильтр по риску (HIGH/MEDIUM/LOW); клик → переход на `/dossier/$id` (по `node_id`+`investigation_id` из текущего стора, либо disabled, если нет привязки).
- Источник данных: `fetchSignals(investigationId)` (если есть активное расследование), иначе пустое состояние «нет активного расследования».
- Пункт в `Sidebar.tsx` + ключи i18n `nav.signals` (RU/KK/EN).

## 6. Модалка «Улика»
- Лёгкий `Dialog` с `fetchEvidence`: snippet, source+url, time, confidence, custody_steps/artifacts (compact JSON view моноширинным).
- Используется из `DetailPanel`, `/signals`, дossier.

## 7. Persist‑слой
- В `store.ts` `applyLive` теперь принимает обогащённые сущности и edges; добавить `signals: SignalResponse[]` и `taskStatus: TaskStatusResponse | null`; persist‑partialize обновить.
- При получении SSE `scan_done` запускать `fetchTask` один раз для финального статуса.

## 8. i18n (`src/i18n/dict.ts`)
- Добавить ключи: `signals.title/empty/filter.*`, `dossier.download/timeline/evidence/copy`, `task.step.*`, `task.eta`, `evidence.modal.title/custody/artifacts`.
- RU/KK/EN — на основе словаря из документа (Расследование/Сущности/Связи/Улики/Досье/Сигналы/Кошелёк/Телефон/Контакт/Отчёт/Скачать/Живой поток/Хронология/Достоверность/Оценка риска/Копировать/Скопировано) и их KK/EN аналогов.

## Чего НЕ делаем
- Не переключаем тему на «slate‑900 + blue‑600», не вводим Inter, не делаем green=good, не убираем светлую тему, не правим `--risk-*` — это нарушит core‑правила проекта.
- Не пересоздаём граф на Cytoscape: текущий рендер графа продолжает работать; добавление полей из API не требует смены движка.
- Не трогаем уже работающие SSE‑консоль, CAPTCHA‑страницу и Bureau‑оболочку.

## Файлы
- edit `src/lib/sentinelApi.ts` (типы + мапперы + новые функции)
- edit `src/components/sentinel/store.ts` (signals, taskStatus, расширенный applyLive)
- edit `src/components/sentinel/DetailPanel.tsx` (evidence_refs + timeline + кнопка отчёта)
- edit `src/components/sentinel/ScanControl.tsx` (прогресс/шаги/ETA)
- edit `src/routes/index.tsx` (графики на реальных stats)
- edit `src/routes/dossier.$id.tsx` (полное досье + reports)
- edit `src/routes/reports.tsx` / `src/components/sentinel/reportsStore.ts` (реальный backend)
- create `src/routes/signals.tsx`
- create `src/components/sentinel/EvidenceDialog.tsx`
- edit `src/components/sentinel/Sidebar.tsx` (пункт «Сигналы»)
- edit `src/i18n/dict.ts` (новые ключи RU/KK/EN)

## Технические детали
- `LiveEdge` остаётся кортежем для совместимости; добавляем параллельную мапу `edgeMeta: Record<"src|tgt", {relation,confidence,weight,evidenceIds}>` в стор, чтобы Graph мог красить рёбра по `relation_type` без миграции существующих потребителей.
- Поллинг — внутри `useEffect` в layout `AppShell`/`ScanControl`, очищается на unmount; дебаунс `fetchGraph` (250 мс) уже есть в `agentStream.ts`.
- Все цвета риска — `var(--risk-high|medium|low|critical)`; нет хардкод hex.
- Все API‑ошибки — `toast.error` (sonner уже подключён); сетка не падает, fallback на мок.
