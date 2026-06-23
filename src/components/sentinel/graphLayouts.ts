import { ENTITIES, type SentinelEntity } from "./data";

export type LayoutKind = "force" | "radial" | "hierarchical" | "geographic";
export type Pos = { x: number; y: number };

const FORCE: Record<string, Pos> = {
  "e-alpha":  { x: 380, y: 200 },
  "e-tg":     { x: 80,  y: 60 },
  "e-forum":  { x: 80,  y: 340 },
  "e-w1":     { x: 700, y: 80 },
  "e-w2":     { x: 720, y: 260 },
  "e-phone":  { x: 700, y: 400 },
  "e-loc":    { x: 380, y: 460 },
  "e-osint":  { x: 80,  y: 220 },
};

function hierarchical(): Record<string, Pos> {
  const rows: Record<string, SentinelEntity[]> = { critical: [], high: [], medium: [], low: [] };
  ENTITIES.forEach((e) => rows[e.risk].push(e));
  const order = ["critical", "high", "medium", "low"] as const;
  const out: Record<string, Pos> = {};
  const xCenter = 400, xSpan = 560, yStart = 70, yGap = 130;
  order.forEach((r, ri) => {
    const list = rows[r];
    const step = list.length > 1 ? xSpan / (list.length - 1) : 0;
    const x0 = list.length > 1 ? xCenter - xSpan / 2 : xCenter;
    list.forEach((e, i) => { out[e.id] = { x: x0 + step * i, y: yStart + ri * yGap }; });
  });
  return out;
}

function radial(selectedId: string | null): Record<string, Pos> {
  const centerId = selectedId && ENTITIES.find((e) => e.id === selectedId) ? selectedId : "e-alpha";
  const cx = 400, cy = 260, R = 230;
  const others = ENTITIES.filter((e) => e.id !== centerId);
  const out: Record<string, Pos> = { [centerId]: { x: cx, y: cy } };
  others.forEach((e, i) => {
    const a = (i / others.length) * Math.PI * 2 - Math.PI / 2;
    out[e.id] = { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  return out;
}

// Synthetic regional grid — three KZ regions + offshore + global cell
export const REGIONS: Record<string, { x: number; y: number; label: string; cell: string }> = {
  "e-alpha":  { x: 360, y: 240, label: "Almaty",   cell: "kz-alm" },
  "e-loc":    { x: 360, y: 360, label: "Almaty",   cell: "kz-alm" },
  "e-phone":  { x: 300, y: 300, label: "Almaty",   cell: "kz-alm" },
  "e-tg":     { x: 90,  y: 110, label: "Astana",   cell: "kz-ast" },
  "e-forum":  { x: 110, y: 380, label: "Shymkent", cell: "kz-shy" },
  "e-w1":     { x: 680, y: 130, label: "Offshore", cell: "off"    },
  "e-w2":     { x: 720, y: 270, label: "Offshore", cell: "off"    },
  "e-osint":  { x: 580, y: 430, label: "Global",   cell: "global" },
};

function geographic(): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  Object.entries(REGIONS).forEach(([id, p]) => { out[id] = { x: p.x, y: p.y }; });
  return out;
}

export function getLayout(kind: LayoutKind, selectedId: string | null): Record<string, Pos> {
  switch (kind) {
    case "force":        return FORCE;
    case "radial":       return radial(selectedId);
    case "hierarchical": return hierarchical();
    case "geographic":   return geographic();
  }
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