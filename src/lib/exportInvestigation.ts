import jsPDF from "jspdf";
import type { SentinelEntity, LogRow } from "@/components/sentinel/data";
import type { LiveEdge, InvestigationMeta, SignalResponse } from "@/lib/sentinelApi";

export interface ExportPayload {
  investigation: InvestigationMeta | null;
  entities: SentinelEntity[];
  edges: LiveEdge[];
  signals?: SignalResponse[];
  logRows?: LogRow[];
  title?: string;
  filename?: string;
}

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export the current investigation (live store data) as a paginated PDF. */
export function exportInvestigationPdf(p: ExportPayload): string {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const FOOTER_Y = H - 28;

  const invId = p.investigation?.id || "—";
  const invTitle = p.title || p.investigation?.title || `Shadowless investigation ${invId.slice(0, 8)}`;
  const created = new Date().toISOString().replace("T", " ").slice(0, 19) + "Z";

  let page = 1;

  const drawHeader = () => {
    doc.setFillColor(11, 14, 20);
    doc.rect(0, 0, W, 84, "F");
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(2);
    doc.line(0, 84, W, 84);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(78, 222, 163);
    doc.text("SHADOWLESS · INVESTIGATIVE BRIEFING", M, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text("RESTRICTED", W - M, 30, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(225, 226, 235);
    const lines = doc.splitTextToSize(invTitle, W - M * 2) as string[];
    doc.text(lines[0], M, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 150, 165);
    doc.text(`${invId} · ${created}`, M, 74);
  };

  let y = 110;
  drawHeader();

  const newPage = () => {
    page += 1;
    doc.addPage();
    drawHeader();
    y = 110;
  };
  const ensure = (need: number) => { if (y + need > FOOTER_Y - 10) newPage(); };

  const heading = (h: string) => {
    ensure(36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(h.toUpperCase(), M, y);
    y += 6;
    doc.setDrawColor(31, 38, 48);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 14;
  };

  const para = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 44, 52);
    const lines = doc.splitTextToSize(text, W - M * 2) as string[];
    for (const line of lines) {
      ensure(14);
      doc.text(line, M, y);
      y += 14;
    }
    y += 6;
  };

  // Summary strip
  const riskCounts = p.entities.reduce(
    (acc, e) => { acc[e.risk] = (acc[e.risk] || 0) + 1; return acc; },
    {} as Record<string, number>
  );
  doc.setFillColor(20, 24, 32);
  doc.rect(M, y, W - M * 2, 36, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(225, 226, 235);
  doc.text(`Entities: ${p.entities.length}    Edges: ${p.edges.length}    Signals: ${p.signals?.length || 0}`, M + 12, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 170, 180);
  doc.text(
    `Critical ${riskCounts.critical || 0}  ·  High ${riskCounts.high || 0}  ·  Medium ${riskCounts.medium || 0}  ·  Low ${riskCounts.low || 0}`,
    M + 12, y + 28,
  );
  y += 50;

  if (p.investigation) {
    heading("Investigation");
    para(`Title: ${p.investigation.title || "—"}`);
    para(`Status: ${p.investigation.status || "—"}`);
    if (p.investigation.created_at) para(`Created: ${p.investigation.created_at}`);
  }

  if (p.entities.length) {
    heading(`Entities (${p.entities.length})`);
    for (const e of p.entities.slice(0, 200)) {
      ensure(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 44, 52);
      doc.text(`• ${e.label}`, M, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110, 120, 130);
      doc.text(`${e.kind} · risk ${e.risk} (${e.riskScore}) · conf ${Math.round((e.confidence || 0) * 100)}%`, M + 12, y + 12);
      y += 24;
      if (e.summary) {
        const lines = doc.splitTextToSize(e.summary, W - M * 2 - 12) as string[];
        for (const line of lines.slice(0, 3)) {
          ensure(12);
          doc.setTextColor(80, 90, 100);
          doc.text(line, M + 12, y);
          y += 12;
        }
      }
      y += 4;
    }
    if (p.entities.length > 200) para(`… +${p.entities.length - 200} more`);
  }

  if (p.signals && p.signals.length) {
    heading(`Signals (${p.signals.length})`);
    for (const s of p.signals.slice(0, 200)) {
      ensure(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 44, 52);
      doc.text(`[${(s.risk || "").toUpperCase()}] ${s.finding || s.id}`, M, y);
      y += 12;
      const body = `${s.source || ""} · conf ${s.confidence ?? "—"} · ${s.time || ""}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110, 120, 130);
      doc.text(body, M + 12, y);
      y += 14;
    }
  }

  if (p.edges.length) {
    heading(`Relationships (${p.edges.length})`);
    for (const [a, b, w, t] of p.edges.slice(0, 300)) {
      ensure(12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 90, 100);
      doc.text(`${a}  →  ${b}    [${w}${t ? ` · t${t}` : ""}]`, M, y);
      y += 12;
    }
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text("RESTRICTED · do not distribute outside CIB-04", M, FOOTER_Y);
    doc.text(`Page ${i} / ${total}`, W - M, FOOTER_Y, { align: "right" });
  }

  const fname = p.filename || `shadowless-${invId.slice(0, 8) || "report"}-${ts()}.pdf`;
  doc.save(fname);
  return fname;
}

/** Export a JSON bundle of the investigation (graph + signals). */
export function exportInvestigationJson(p: ExportPayload): string {
  const invId = p.investigation?.id || "report";
  const fname = p.filename || `shadowless-${invId.slice(0, 8)}-${ts()}.json`;
  const payload = {
    exported_at: new Date().toISOString(),
    investigation: p.investigation,
    entities: p.entities,
    edges: p.edges,
    signals: p.signals || [],
    logRows: p.logRows || [],
  };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    fname,
  );
  return fname;
}

/** Export evidence/signals as CSV. */
export function exportSignalsCsv(signals: SignalResponse[], logRows: LogRow[] = []): string {
  const fname = `shadowless-evidence-${ts()}.csv`;
  const rows: string[][] = [["id", "time", "source", "entity", "title", "risk", "score", "confidence", "status"]];
  for (const s of signals) {
    rows.push([
      s.id,
      s.time || "",
      s.source || "",
      s.node_id || "",
      (s.finding || "").replace(/[\n\r,]/g, " "),
      s.risk || "",
      "",
      String(s.confidence ?? ""),
      s.status || "",
    ]);
  }
  for (const l of logRows) {
    rows.push([
      l.id,
      l.time,
      l.source,
      l.entity,
      (l.finding || "").replace(/[\n\r,]/g, " "),
      l.risk,
      "",
      String(l.confidence ?? ""),
      l.status,
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), fname);
  return fname;
}