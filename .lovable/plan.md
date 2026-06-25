# Живая консоль агента (SSE)

Подключаемся к `${API_BASE}/api/v1/stream`, парсим события, выводим их терминал-лентой (новые сверху). На `graph_built` и `scan_done` дополнительно перезапрашиваем граф, на `high_risk` показываем тост-алерт.

## 1. SSE-клиент `src/lib/agentStream.ts` (новый)
- Типы `AgentEvent` (union по `type`): `scan_started | plan | scan | expand | graph_built | high_risk | scan_done` + общие поля `ts`, `investigation_id`.
- Хук `useAgentStream()`:
  - открывает `new EventSource(\`${API_BASE}/api/v1/stream\`)` один раз на mount;
  - `onmessage` → `JSON.parse`, пушит событие в zustand store;
  - на `graph_built` / `scan_done`: вызывает `fetchGraph(investigation_id)` → `mapApiGraph` → `applyLive` (граф растёт на глазах, не сбрасывая `investigationId`);
  - на `high_risk`: `toast.error` с заголовком `🚨 HIGH-RISK: {label}` и описанием score;
  - закрывает `es.close()` в cleanup;
  - авто-reconnect при `onerror` через 3 сек (EventSource сам ретраит, но добавим лог).

## 2. Store `src/components/sentinel/agentConsoleStore.ts` (новый)
- zustand + persist (`shadowless.console.v1`), кольцевой буфер на 300 строк.
- `entries: ConsoleEntry[]` где `ConsoleEntry = { id, ts, type, text, level, investigation_id }`.
- `push(entry)`, `clear()`.
- Переводчик `formatEvent(e, t)` возвращает локализованный текст по схеме из ТЗ (RU как fallback; ключи `console.evt.*` в `dict.ts` для RU/KK/EN).

## 3. UI `src/components/sentinel/AgentConsole.tsx` (новый)
- Тёмный терминал в стиле проекта: `bg-background border-border`, JetBrains Mono, hairline rules, без glow.
- Заголовок: `● LIVE AGENT STREAM` + счётчик, кнопка Clear, индикатор соединения (connected/reconnecting).
- Лента: `flex-col-reverse` или ручной reverse — новые сверху; каждая строка: `[HH:MM:SS] [TYPE] текст`, иконка/цвет по `type` (`high_risk` — amber/red акцент, `graph_built`/`scan_done` — primary, `plan` — muted, остальные — foreground).
- Авто-скролл сверху при новой записи; пустое состояние — «Ожидание событий агента…».

## 4. Интеграция
- Монтируем `useAgentStream()` один раз в `AppShell` (рядом с `LiveTicker`), чтобы поток работал на всех страницах.
- Добавляем `<AgentConsole />` в `BottomDock`/`BottomPanels` как новую вкладку «Консоль агента» (ключ `console.tab.agent`), плюс отдельный route не нужен.
- На размонтировании `AppShell` (по сути — закрытие приложения) EventSource закрывается; reconnect обрабатывается внутри хука.

## 5. i18n (`src/i18n/dict.ts`)
Ключи и форматы (RU пример):
```
console.title          → «Консоль агента»
console.tab.agent      → «Агент»
console.empty          → «Ожидание событий агента…»
console.clear          → «Очистить»
console.conn.live      → «онлайн»
console.conn.reconn    → «переподключение…»
console.evt.scan_started → «🔍 Запущено сканирование: {target} [{source_type}]»
console.evt.plan         → «🧠 PLANNER: сформировано {count} запросов: {queries}»
console.evt.scan         → «📡 Скан ‘{query}’ (раунд {round}): найдено {found}, принято {kept}»
console.evt.expand       → «🔗 Новые зацепки: {queries}»
console.evt.graph_built  → «🕸 Граф: {nodes} узлов, {edges} связей»
console.evt.high_risk    → «🚨 HIGH-RISK: {label} ({node_type}), score {risk_score}»
console.evt.scan_done    → «✅ Готово: {nodes}/{edges}»
```
KK/EN — аналогично.

## Технические детали
- `EventSource` доступен только в браузере → хук `useEffect` без SSR-проблем (компонент клиентский).
- `fetchGraph` уже есть в `sentinelApi.ts`; вызываем только если событие содержит валидный `investigation_id` и он совпадает с текущим в store (либо принимаем любой, если store пуст — тогда `setInvestigationId`).
- Дедупликация повторного `fetchGraph` на быстрых `scan_done` после `graph_built`: дебаунс 500 мс по `investigation_id`.
- Тост `high_risk` через уже подключённый `sonner` (`toast.error`, duration 6000).
- Стиль терминала использует существующие токены: `text-primary`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-background`; никаких хардкод-hex.

## Файлы
- create `src/lib/agentStream.ts`
- create `src/components/sentinel/agentConsoleStore.ts`
- create `src/components/sentinel/AgentConsole.tsx`
- edit `src/components/sentinel/AppShell.tsx` (вызов хука)
- edit `src/components/sentinel/BottomDock.tsx` или `BottomPanels.tsx` (вкладка «Агент»)
- edit `src/i18n/dict.ts` (ключи RU/KK/EN)
