import jsPDF from "jspdf";
import type { Report } from "@/components/sentinel/data";

/** Render a Shadowless investigative briefing as a paginated PDF and trigger download. */
export function downloadReportPdf(r: Report) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const FOOTER_Y = H - 28;

  const drawHeader = (page: number) => {
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
    doc.text(r.classification, W - M, 30, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(225, 226, 235);
    const titleLines = doc.splitTextToSize(r.title, W - M * 2);
    doc.text(titleLines[0], M, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 150, 165);
    doc.text(`${r.id} · Case ${r.caseId} · ${r.created} · ${r.author}`, M, 74);
    void page;
  };

  const drawFooter = (page: number, total: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text("RESTRICTED · do not distribute outside CIB-04", M, FOOTER_Y);
    doc.text(`Page ${page} / ${total}`, W - M, FOOTER_Y, { align: "right" });
  };

  let y = 110;
  let page = 1;
  drawHeader(page);

  const newPage = () => {
    page += 1;
    doc.addPage();
    drawHeader(page);
    y = 110;
  };

  const ensure = (need: number) => {
    if (y + need > FOOTER_Y - 10) newPage();
  };

  const writeBlock = (heading: string, body: string) => {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(heading.toUpperCase(), M, y);
    y += 6;
    doc.setDrawColor(31, 38, 48);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 44, 52);
    const lines = doc.splitTextToSize(body, W - M * 2) as string[];
    for (const line of lines) {
      ensure(14);
      doc.text(line, M, y);
      y += 14;
    }
    y += 10;
  };

  // Risk strip
  const riskColor = { critical: "#ff5d6c", high: "#ff8a4c", medium: "#f5b850", low: "#ffc94d" }[r.risk];
  doc.setFillColor(riskColor);
  doc.rect(M, y, 6, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 44, 52);
  doc.text(`RISK · ${r.risk.toUpperCase()}`, M + 14, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 110, 120);
  doc.text(`State: ${r.state.toUpperCase()}    Pages: ${r.pages}    Entities: ${r.entityIds.length}    Evidence items: ${r.evidenceIds.length}`, M + 14, y + 24);
  y += 50;

  writeBlock("Executive summary", r.summary);
  r.sections.forEach((s) => writeBlock(s.heading, s.body));

  if (r.entityIds.length) {
    writeBlock("Linked entities", r.entityIds.join(", "));
  }
  if (r.evidenceIds.length) {
    writeBlock("Linked evidence", r.evidenceIds.join(", "));
  }

  // Footer on each page
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(p, total);
  }

  doc.save(`${r.id}.pdf`);
}