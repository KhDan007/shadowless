# Plan — Responsive + de-cluttered State Sentinel

Two goals in one pass: (1) the dashboard must feel native on phone, tablet, and ultrawide; (2) the desktop view must stop shouting — fewer simultaneous panels, clearer hierarchy, one obvious next click.

## Guiding principles

- **One primary action visible at all times**, and it changes with context: no selection → `Start Scan`; entity selected → `Investigate` (Open Timeline / Generate Report).
- **Progressive disclosure**: secondary metadata, legends, and provenance live behind chips, popovers, or tabs — not on the canvas.
- **Group, don't list**: related info collapses into single composite cards instead of five stacked sections.
- **Graph is the protagonist** at every breakpoint.

## 1. Responsive system

Four breakpoints, one layout engine:

```text
≥1280 xl  [sidebar 240 | graph + dock | detail 320]    full 3-pane
1024 lg   [icon rail 56 | graph + dock | detail 300]   sidebar collapsed
 768 md   [icon rail 56 | graph + dock]                detail = right slide-over
<768 sm   [graph fullscreen]                           sidebar = sheet, detail = bottom sheet, dock = bottom tab bar
```

- Sidebar gets a real **icon-rail** mode (logo, 7 nav icons, status dots) reusing the current data; full version slides over on hover or via menu.
- Detail panel becomes a **Sheet** (shadcn) below `xl`; opens on node tap, closes on backdrop.
- Bottom dock becomes a single **Tabbed dock** (Evidence · AI · Trends · Alerts) instead of 4 panels side-by-side. On mobile the tabs move to a bottom nav bar; tapping one opens a half-height bottom sheet over the graph.
- Top bar collapses on mobile to: logo · case chip · search icon · scan button. Risk pills, alerts, export collapse into an overflow `⋯` menu.
- Mobile graph gets pinch-zoom and a floating **+ / fit / filter** mini-FAB cluster (replaces React Flow controls which are too small for touch).

## 2. De-clutter passes

### Top bar
- Merge the 4 risk pills (Low/Med/High/Crit) into **one composite chip**: `47 entities · 3 critical` that opens a popover with the breakdown + mini bar chart.
- Move `Export Report` and `Alerts` (bell) into an overflow `⋯` menu on `<xl`.
- The `Start Scan` button **morphs**: when an entity is selected it visually de-emphasizes (outline) and a new primary `Investigate ▸` button appears in its slot.

### Graph workspace
- AI Inference card, legend, and toolbar are three separate floating layers today. Consolidate:
  - **Toolbar** stays top-left, single rounded pill (zoom controls + layout + filter).
  - **Legend** collapses to a single `i` button bottom-left that opens a popover (no permanent rectangle on the canvas).
  - **AI Inference** card becomes a slim top-right pill: `● AI · 14 new relationships` — clicking expands it. Removes the biggest visual weight from the canvas.
- Add a **contextual next-step hint** strip just under the top bar:
  - no selection: `Tip · Select a high-risk node to begin investigation` with an arrow pointing at the densest cluster
  - node selected: `Reviewing Entity Alpha · Open timeline or generate report ▸`
  - scan running: `Scanning sources… ETA 00:18`
- Nodes themselves stay, but **secondary metadata is hidden until hover/selection**. Default card shows: icon, name, risk dot, risk score. On hover it expands to add confidence + connections. Reduces text density on the canvas by ~40%.

### Right detail panel (entity intelligence)
- Today: 6 stacked sections + 3 equal action buttons. New shape:
  - **Header block**: avatar/icon, name, alias, risk badge, ONE big `Investigate ▸` primary CTA, secondary `Pin` icon-button only.
  - **Score strip**: risk score with bar + 3 inline KPIs (confidence, connections, reliability) in a single row.
  - **Tabs**: `Summary · Identifiers · Evidence` — only one section visible at a time. AI summary becomes the default tab.
  - **Provenance** (source, reliability, last detected) moves to a small footer line, not its own panel.
  - `Open Timeline` and `Generate Report` become a 2-button group inside the active tab footer, not three equal buttons.

### Bottom area
- Replace the 4-panel grid with a **single Tabbed Dock** with a count badge on each tab:
  `Evidence (10) · AI Findings (14 new) · Trends · Alerts (3)`.
- Dock has a **collapse handle** so the user can hide it entirely and give the graph the full height. State persists in localStorage.

### Sidebar
- Case list trims to **active case (expanded) + 3 collapsed rows**. A `View all 12 cases` link opens a command-palette style search instead of an always-visible list.
- Status footer (System Ready / AI / Secure) compresses to **three colored dots** with a tooltip on hover. Saves vertical space.
- Nav labels hide in icon-rail mode but appear in tooltips.

## 3. Guidance layer (moderate)

- **Contextual hint strip** (described above) is the always-on guide. It never blocks content, lives in one fixed slot, and updates based on `selectedId` + scan state.
- **First-visit coach marks**: 3 quick popovers (sidebar nav → graph → detail panel) using a tiny custom overlay, dismissible, stored in `localStorage` as `sentinel.onboarded=true`. No external library.
- **Empty states get one CTA each** (e.g. evidence tab with no rows → `Run a scan to populate evidence`).

## 4. Component & file changes

```text
src/components/sentinel/
  Sidebar.tsx          → add `collapsed` prop + icon-rail mode; case list trimming; status dots
  TopBar.tsx           → composite risk chip popover; overflow menu; morphing primary CTA
  Graph.tsx            → slim AI pill, popover legend, denser node card, mobile FAB controls
  DetailPanel.tsx      → tabbed body (Summary/Identifiers/Evidence); single primary CTA
  BottomDock.tsx       NEW — tabbed container that wraps Evidence/AI/Trends/Alerts; collapse handle
  HintStrip.tsx        NEW — contextual next-step hint, reads selection + scan state
  Onboarding.tsx       NEW — first-visit coach marks, localStorage-gated
  useLayout.ts         NEW — small hook returning `mode: 'mobile'|'tablet'|'desktop'|'xl'` from matchMedia, plus sidebar/dock open state

src/routes/index.tsx   → orchestrate breakpoints: render Sheet for sidebar/detail on mobile, dock-as-tabbar on mobile
```

Existing `BottomPanels.tsx` content (EvidenceTable, AIFindings, ConfidenceChart, RecentAlerts) is reused inside the new `BottomDock` tabs — no logic rewrite, just rehoming.

## 5. Technical details

- **Breakpoint hook** uses `window.matchMedia` with SSR-safe defaults (assume desktop on server to avoid layout shift; re-hydrate on client).
- **Sheets/drawers** use existing shadcn `Sheet` and `Drawer` (already in `components/ui`). Bottom sheet for mobile detail uses `Drawer` with snap points `[0.4, 0.92]`.
- **Tabs** use shadcn `Tabs` for both the detail panel and bottom dock — consistent feel.
- **Mobile graph controls**: a small Framer-motion FAB cluster bottom-right with `+`, `−`, `⛶ fit`, `≡ filter`. The default React Flow `<Controls>` hides below `md`.
- **Touch targets** raised to 36–40px on mobile per State Sentinel `touch-target` guidance.
- **Hint strip** is `h-8`, fixed slot, never causes layout shift; uses Framer `AnimatePresence` for text swap.
- **Coach marks** use a `<dialog>`-free portal: an absolutely-positioned tooltip + a dimmed `pointer-events-none` overlay; arrow keys / Esc dismiss.
- **No new dependencies**. All shadcn primitives, Framer Motion, lucide-react, React Flow already installed.
- **Preview viewport**: I'll switch the preview to mobile during implementation to verify each breakpoint, then back to desktop for the final check.

## 6. What stays the same

- Color tokens, typography, emerald accent system, mock data — untouched.
- React Flow node types, edge styling, graph layout coordinates.
- All existing routes, server functions, font loading via `__root.tsx`.

## Out of scope (call out now)

- No new pages (Reports, Settings, AI Analysis routes stay stubs).
- No real backend / live data — still synthetic.
- No light mode, no i18n, no accessibility audit beyond touch-target sizing and focus rings.
