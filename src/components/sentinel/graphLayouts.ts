import { type SentinelEntity } from "./data";

export type LayoutKind = "force" | "radial" | "hierarchical" | "geographic";
export type Pos = { x: number; y: number };

// Approx. footprint of an EntityNode card; used by the de-overlap pass.
const NODE_W = 280;
const NODE_H = 130;

/** Push apart any nodes whose bounding boxes overlap. Cheap O(n²·k). */
function deoverlap(pos: Record<string, Pos>, iterations = 60): Record<string, Pos> {
  const ids = Object.keys(pos);
  const out: Record<string, Pos> = {};
  ids.forEach((id) => { out[id] = { ...pos[id] }; });
  const minDx = NODE_W + 24;
  const minDy = NODE_H + 24;
  for (let k = 0; k < iterations; k++) {
    let moved = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = out[ids[i]];
        const b = out[ids[j]];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = minDx - Math.abs(dx);
        const overlapY = minDy - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          // Push along the axis with smaller overlap (cheaper separation).
          if (overlapX < overlapY) {
            const push = (overlapX / 2) * (dx >= 0 ? 1 : -1) || overlapX / 2;
            a.x -= push; b.x += push;
          } else {
            const push = (overlapY / 2) * (dy >= 0 ? 1 : -1) || overlapY / 2;
            a.y -= push; b.y += push;
          }
        }
      }
    }
    if (!moved) break;
  }
  return out;
}

const FORCE: Record<string, Pos> = {
  "e-alpha":  { x: 460, y: 260 },
  "e-tg":     { x:  60, y:  60 },
  "e-forum":  { x:  60, y: 460 },
  "e-w1":     { x: 860, y:  60 },
  "e-w2":     { x: 880, y: 320 },
  "e-phone":  { x: 860, y: 540 },
  "e-loc":    { x: 460, y: 580 },
  "e-osint":  { x:  60, y: 260 },
};

function hierarchical(entities: SentinelEntity[]): Record<string, Pos> {
  const rows: Record<string, SentinelEntity[]> = { critical: [], high: [], medium: [], low: [] };
  entities.forEach((e) => rows[e.risk].push(e));
  const order = ["critical", "high", "medium", "low"] as const;
  const out: Record<string, Pos> = {};
  const xCenter = 500, xSpan = 900, yStart = 80, yGap = 180;
  order.forEach((r, ri) => {
    const list = rows[r];
    const step = list.length > 1 ? Math.max(NODE_W + 32, xSpan / (list.length - 1)) : 0;
    const x0 = list.length > 1 ? xCenter - xSpan / 2 : xCenter;
    list.forEach((e, i) => { out[e.id] = { x: x0 + step * i, y: yStart + ri * yGap }; });
  });
  return out;
}

function radial(entities: SentinelEntity[], selectedId: string | null): Record<string, Pos> {
  const fallback = entities[0]?.id ?? "";
  const centerId = selectedId && entities.find((e) => e.id === selectedId) ? selectedId : fallback;
  const cx = 500, cy = 320;
  const others = entities.filter((e) => e.id !== centerId);
  // Scale ring radius so neighbour cards don't collide on the circumference.
  const minArc = NODE_W + 40;
  const R = Math.max(280, (others.length * minArc) / (2 * Math.PI));
  const out: Record<string, Pos> = { [centerId]: { x: cx, y: cy } };
  others.forEach((e, i) => {
    const a = (i / others.length) * Math.PI * 2 - Math.PI / 2;
    out[e.id] = { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  return out;
}

// Synthetic regional grid — three KZ regions + offshore + global cell
export const REGIONS: Record<string, { x: number; y: number; label: string; cell: string }> = {
  "e-alpha":  { x: 460, y: 280, label: "Almaty",   cell: "kz-alm" },
  "e-loc":    { x: 460, y: 480, label: "Almaty",   cell: "kz-alm" },
  "e-phone":  { x: 460, y: 680, label: "Almaty",   cell: "kz-alm" },
  "e-tg":     { x:  80, y: 100, label: "Astana",   cell: "kz-ast" },
  "e-forum":  { x:  80, y: 480, label: "Shymkent", cell: "kz-shy" },
  "e-w1":     { x: 880, y: 140, label: "Offshore", cell: "off"    },
  "e-w2":     { x: 880, y: 340, label: "Offshore", cell: "off"    },
  "e-osint":  { x: 880, y: 580, label: "Global",   cell: "global" },
};

function geographic(entities: SentinelEntity[]): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  // Use predefined positions when known; otherwise fall back to a grid for live entities.
  entities.forEach((e, i) => {
    const r = REGIONS[e.id];
    if (r) { out[e.id] = { x: r.x, y: r.y }; return; }
    const cols = 4;
    out[e.id] = { x: 80 + (i % cols) * (NODE_W + 40), y: 80 + Math.floor(i / cols) * (NODE_H + 40) };
  });
  return out;
}

function forceLayout(entities: SentinelEntity[]): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  entities.forEach((e, i) => {
    if (FORCE[e.id]) { out[e.id] = FORCE[e.id]; return; }
    const cols = 4;
    out[e.id] = { x: 80 + (i % cols) * (NODE_W + 40), y: 60 + Math.floor(i / cols) * (NODE_H + 40) };
  });
  return out;
}

export function getLayout(kind: LayoutKind, entities: SentinelEntity[], selectedId: string | null): Record<string, Pos> {
  let raw: Record<string, Pos>;
  switch (kind) {
    case "force":        raw = forceLayout(entities); break;
    case "radial":       raw = radial(entities, selectedId); break;
    case "hierarchical": raw = hierarchical(entities); break;
    case "geographic":   raw = geographic(entities); break;
  }
  return deoverlap(raw);
}

export const LAYOUT_OPTIONS: { key: LayoutKind; label: string; hint: string }[] = [
  { key: "force",        label: "Force-directed", hint: "Natural clusters from edge weights" },
  { key: "radial",       label: "Radial",         hint: "Selected entity at center" },
  { key: "hierarchical", label: "Hierarchical",   hint: "Grouped top-down by risk tier" },
  { key: "geographic",   label: "Geographic",     hint: "Positioned by inferred region" },
];

/** Parse "2026-06-24 14:22 UTC+5" → epoch ms. */
export function parseLastSeen(s: string): number {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))? UTC([+-]\d+)$/);
  if (!m) return 0;
  const tz = `${m[7].startsWith("-") ? "-" : "+"}${String(Math.abs(parseInt(m[7], 10))).padStart(2, "0")}:00`;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}${tz}`).getTime();
}