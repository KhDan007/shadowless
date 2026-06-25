
# Frontend issues — brainstorm (no code changes yet)

Below is a candid pass over the current code. I haven't fixed anything — flag which buckets you want me to tackle and I'll write a focused plan per bucket.

## 1. Mock / live separation — still leaking

- **`src/routes/index.tsx` (home/demo)** imports `DEMO_METRICS`, `ENTITIES`, `SIGNALS_FEED`, `ALERTS`, etc. from `@/data/demoData` and renders them as if they were live. There's no DEMO badge on this page and no path to switch it to live `fetchStats()` data even when an investigation exists. The user-visible "Live Demo" framing is fine for `/`, but several widgets (entities list, signals feed) duplicate workspace concepts and look authoritative.
- **`LiveTicker`** renders whenever `logRows.length > 0`. After `resetToMock()` rows come from `MOCK_LOG_ROWS`; after a live scan rows come from signals. There is no visual marker telling the operator which one they are looking at. Easy to mistake a mock ticker entry for a real signal.
- **`DetailPanel`** always reads from `entities`, so when `isDemo` is true the dossier CTA is gated (`canDossier = isLive && !!investigationId`) but `Investigate →` and `Pin` still work on mock entities, silently. Consider hiding/disabling actions that have no live meaning in demo mode, or labelling the whole panel `DEMO`.
- **`reportsStore`** still seeds `REPORTS` (mock) and prepends user-created custom reports in localStorage. Per the contract reports must come from `/reports` for the current investigation; the current behavior will show mock reports even after a live scan and persist "custom" reports across investigations forever.

## 2. SSE / agent stream

- `useAgentStream` hardcodes `currentSource` to `"telegram"` for the refetch path (`mapApiGraph(graph, "telegram")`). For a `darknet` or `mock` scan this mis-labels the source on every node ("Telegram Crawl"). The real source should be carried on the investigation or derived from the stream event.
- No `addEventListener("scan_started", …)` etc. — relying solely on `onmessage`. If the backend ever emits named SSE events the client will silently drop them. Worth adding named handlers as a fallback.
- `lastRefetch` debouncing is keyed per-investigation but the 500ms window combined with a 250ms `setTimeout` means a `graph_built` + `scan_done` arriving back-to-back will only trigger one refetch. Usually fine, but `scan_done` should always win — currently it can be the one that gets dropped.
- `EventSource` auto-reconnects but we set `setConn("reconnecting")` on every transient error including normal keep-alive hiccups; the UI dot will flicker amber under normal operation. Debounce the state change.
- No backoff / give-up: if the server is down at mount we sit in `connecting` forever with no user feedback or retry button.
- No `/api/v1/status` health probe before opening SSE — when the API is offline we get a silent stream with mock data behind it.

## 3. Scan flow

- `ScanControl` polls `/tasks/:id` every 2s up to `MAX_POLL_MS = 120s`. Long scans (planner + multi-round expansion) will hit the timeout and surface as a failed scan even though the backend is fine. Either lift the cap, or stop polling once SSE `scan_done` arrives.
- The poller and SSE both apply the graph independently. If SSE fires `scan_done` first, then the poller finishes and overwrites with `applyLive(mapped)` again — fine, but the dossier and signals state is reset twice (because `applyLive` clears `dossier`). Race condition with user clicks.
- `fetchSignals` after success is fire-and-forget; if it fails the operator gets nothing and no retry. Should set an error state on the signals slice.
- No cancel button while scanning. `cancelRef` exists in code but is only triggered on unmount.
- `setStep(t("scan.step.queued"))` uses translation keys for backend steps; but `tk.current_step` from the API is a raw string and bypasses i18n. Either translate known step names or accept that the step label is always English.

## 4. Persistence / hydration

- `partialize` now only persists `investigationId`. Good. But `agentConsoleStore` is not persisted at all — on refresh the operator loses every event they watched, including HIGH-RISK alerts. Consider persisting the last ~200 entries scoped to `investigationId`.
- `useHydrateLiveInvestigation` refetches with source `"mock"` (line 39: `mapApiGraph(g, "mock")`). Same bug as #2 — after refresh, every node is labelled `OSINT` regardless of the original scan source.
- If the persisted `investigationId` belongs to a finished case but the backend has GC'd it, we call `resetToMock()` silently. The user has no idea their case disappeared. A toast + "Start a new scan" prompt would help.

## 5. API client (`sentinelApi.ts`)

- No timeouts on any `fetch` — a hung backend will leave the dossier spinner forever. Wrap in `AbortController` with 30s default.
- No retry/backoff on transient 5xx.
- `fetchSignals` accepts both array and `{signals: []}` shapes — the contract should be one. Pin it and remove the fallback (silent shape drift hides bugs).
- `mapRisk` still synthesizes `critical` from `risk_score >= 70` even though the contract only returns `LOW|MEDIUM|HIGH`. Per the contract review you already flagged: drop `critical` from the live path; reserve it for a UI-only "confirmed bad" badge driven by an analyst action, not by score.
- `formatCreatedAt` formats UTC offset as a hardcoded `UTC+0` regardless of timezone; misleading for KZ users.
- Hardcoded `confidence = 65 / 95` and `reliability = "A" / "B"` fallbacks were supposedly removed but are still in the file (lines ~210-214). Either remove or use nullish-safe `—` rendering in components.
- No `AbortSignal` plumbed through hooks, so navigating away during a `fetchDossier` still runs `setDossier` on an unmounted store — works due to Zustand, but the network is wasted.

## 6. Errors / loading / empty states

- No global error boundary. A throw inside `DetailPanel` (e.g. malformed entity from the API) blanks the whole shell.
- Loaders return mock-when-empty in several places (`logRows.length === 0` → `LiveTicker` hides entirely, no "no signals yet" affordance during a fresh live scan).
- `DetailPanel` `entity = entities.find(...) ?? entities[0]` silently swaps to the first entity when the selected ID disappears (e.g. after a fresh scan). Operator thinks they're looking at A, they're actually looking at B.
- No skeleton states for `/signals`, `/evidence`, `/timeline` while data loads.

## 7. Accessibility / interaction

- Most icon-only buttons (Pin, Close, Clear console, dock toggles) have a `title` but no `aria-label`. Screen readers announce nothing useful.
- Live ticker is a `<button>` per row but the surrounding container scrolls horizontally with no keyboard nav.
- Toasts default to `top-center` on mobile and `bottom-right` on desktop — fine — but HIGH-RISK toast lasts 6s with no "View" action; operator can't click through to the offending node.
- Tab order in `DetailPanel` jumps between collapsible sections without a focus ring on the disclosure buttons.
- Color-only risk encoding (red/orange/amber/green). Add a glyph or text label for color-blind operators (the `riskMeta` atom probably already has a letter; verify it's used everywhere).
- No `prefers-reduced-motion` honoring — `Radar` spinner, ticker advance, dossier typewriter all ignore it.

## 8. i18n drift

- A lot of new keys (`console.evt.*`, `console.toast.*`, `detail.dossier.*`, `task.eta`, `top.demo.*`) were added across RU/KK/EN. No script verifies all three locales contain the same key set; KK in particular tends to fall behind. Worth a tiny build-time check.
- Some operator strings still hardcoded English in components (e.g. the `OSINT` source labels in `mapApiGraph`, `"Investigation report"` default title in `createReport`).

## 9. Routing / nav

- Several routes (`/signals`, `/evidence`, `/timeline`, `/reports/$id`, `/dossier/$id`) likely lack `errorComponent` / `notFoundComponent` — per the TanStack Start rules every loader route needs both. Symptom: a malformed URL crashes to a generic boundary.
- `LiveTicker.focus()` navigates to `/workspace` and dispatches custom events on `window`. If the entity is not on the current investigation's graph (e.g. after a refresh, before hydration completes), the event silently no-ops. Add a fallback toast.

## 10. Visual / design rule violations

- `DetailPanel` line 213: `bg-[color:var(--risk-high)]` — hardcoded raw token in JSX. Codebase rule says use semantic classes/tokens.
- `BottomDock` (per earlier session) still uses hex like `bg-[#0b0e14]` per the memory file's migration debt. Worth a sweep.
- `LiveTicker` has `animate-ping` on the dot — the project's `bureau-direction` memory explicitly bans eased / pulsing motion in favor of `steps()` ticks. Replace with the existing `.pulse-emerald` 2-step tick.
- The dossier "typewriter" effect (`setInterval` advancing 2 chars per 14ms in `DetailPanel`) is exactly the AI-generic effect the design memory cautions against. Either drop it or replace with a single fade-in.
- Several places still use rounded corners (`rounded-full` on the live dot, `rounded-sm` everywhere) — per the design memory, `--radius: 0` is the rule. `rounded-sm` is okay because it resolves to a token, but `rounded-full` for status dots is fine since dots are circles by intent; flagging for consistency.

## 11. Reports

- `reportsStore` is still the source of truth for `/reports` UI even though the contract says reports must be fetched from `/api/v1/investigations/:id/reports`. The new `Download Report` button calls `createReport` but the result is only toasted — never appears in `/reports`. Operator clicks Download, sees a toast, navigates to /reports → it's not there.
- No way to actually download the generated report file from the UI (no link to `storage`/artifact URL from `ReportRecord`).

## 12. Misc

- `LiveTicker` slices `r.time.slice(11)` assuming an ISO-like string. `SignalResponse.time` can be `null`, in which case it renders `""` and the ticker row has a leading bare ` › `. Defensive formatting needed.
- `agentStream.ts` `tsNum = ts > 1e12 ? ts : ts * 1000` — fine for seconds vs ms, but ts could be an ISO string too (typed as `number | string`). The string case falls through to `Date.now()`.
- `console.warn("[agentStream] ...")` left in production code. Fine for now, but consider a debug flag.
- `MAX_POLL_MS` and other magic numbers should live in `src/lib/config.ts` next to `API_BASE`.

---

## How I'd sequence the fixes

If you want me to actually do this, I'd group it like this and tackle one bucket per turn:

1. **Mock/live discipline finish** — kill home-page demo data leak, ticker DEMO badge, demo-mode action gating, remove mock seeds from `reportsStore`.
2. **Scan + SSE robustness** — real source threading, scan cancel, infinite-or-event-driven poller, debounced reconn, dossier/signals retry.
3. **API client hardening** — timeouts, abort signals, pin signals shape, drop synthesized `critical` and hardcoded confidence fallbacks.
4. **A11y + design-system sweep** — aria-labels, reduced motion, hex → tokens, drop typewriter, ban `rounded-full` where not intentional.
5. **Reports wiring** — switch `/reports` to live `fetchReports`, surface artifact link, link Download CTA into the list.
6. **Errors + boundaries** — errorComponent / notFoundComponent on all loader routes; toast + recovery when persisted investigation 404s.

Tell me which buckets you want and I'll write a concrete implementation plan for each.
