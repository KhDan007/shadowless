import { createFileRoute, Link } from "@tanstack/react-router";
import { ENTITIES, LOG_ROWS, type Report } from "@/components/sentinel/data";
import { getReport, useAllReports } from "@/components/sentinel/reportsStore";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { downloadReportPdf } from "@/lib/generateReportPdf";
import { toast } from "sonner";

export const Route = createFileRoute("/dossier/$id")({
  head: ({ params }) => {
    const r = getReport(params.id);
    const title = r ? `Dossier · ${r.title}` : "Dossier · Shadowless";
    return {
      meta: [
        { title },
        { name: "description", content: "Forensic dossier export — paper-stock view." },
        { name: "robots", content: "noindex,nofollow" },
      ],
    };
  },
  errorComponent: ({ error, reset }) => (
    <div className="grid min-h-screen place-items-center bg-[#f1ebdc] text-[#14130f] font-mono p-6">
      <div className="text-center">
        <div className="text-[12px] uppercase tracking-[0.2em] text-[#8a7d5f]">Dossier unavailable</div>
        <div className="mt-2">{String(error)}</div>
        <button onClick={reset} className="mt-4 border border-[#14130f] px-3 py-1 text-[12px]">Retry</button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-[#f1ebdc] text-[#14130f] font-mono p-6">
      <div className="text-center">
        <div className="text-[12px] uppercase tracking-[0.2em] text-[#8a7d5f]">No file matches that identifier</div>
        <Link to="/reports" className="mt-3 inline-block border border-[#14130f] px-3 py-1 text-[12px]">Return to registry</Link>
      </div>
    </div>
  ),
  component: DossierView,
});

// PII redaction — produces a black bar of the same character length.
function redact(s: string): string {
  return s.replace(/(?<=^.{2}).+?(?=.{2}$)/g, (m) => "█".repeat(Math.max(3, m.length)));
}

function DossierView() {
  const { id } = Route.useParams();
  const reports = useAllReports();
  const report = reports.find((r) => r.id === id);
  if (!report) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f1ebdc] p-6 font-mono text-[#14130f]">
        <div className="text-center">
          <div className="text-[12px] uppercase tracking-[0.2em] text-[#8a7d5f]">No file matches that identifier</div>
          <Link to="/reports" className="mt-3 inline-block border border-[#14130f] px-3 py-1 text-[12px]">Return to registry</Link>
        </div>
      </div>
    );
  }
  const r = report as Report;
  const linkedEntities = ENTITIES.filter((e) => r.entityIds.includes(e.id));
  const linkedEvidence = LOG_ROWS.filter((row) => r.evidenceIds.includes(row.id));
  const printDate = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  // Deterministic 16-hex "document hash" derived from the report id
  const docHash = Array.from(r.id)
    .reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0, 5381)
    .toString(16)
    .padStart(8, "0")
    .repeat(2)
    .slice(0, 16)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#3a362f] py-8 print:bg-white print:py-0">
      {/* Floating action bar — hidden on print */}
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between gap-3 px-4 print:hidden">
        <Link
          to="/reports/$id"
          params={{ id: r.id }}
          className="inline-flex items-center gap-1.5 border border-[#8a7d5f]/50 bg-transparent px-2.5 py-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-[#d4cab3] hover:text-white hover:border-white"
        >
          <ArrowLeft size={12} /> back to file
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 border border-[#8a7d5f]/50 px-2.5 py-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-[#d4cab3] hover:text-white hover:border-white"
          >
            <Printer size={12} /> print
          </button>
          <button
            onClick={() => { downloadReportPdf(r); toast.success(`${r.id} downloaded`); }}
            className="inline-flex items-center gap-1.5 bg-[#d4cab3] px-2.5 py-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-[#14130f] hover:bg-white"
          >
            <Download size={12} /> pdf
          </button>
        </div>
      </div>

      {/* Paper sheet */}
      <article
        className="mx-auto max-w-[820px] bg-[#f1ebdc] text-[#14130f] shadow-2xl print:shadow-none print:max-w-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.06'/></svg>\")",
        }}
      >
        {/* Header — classification bar */}
        <header className="border-b-2 border-[#14130f] px-10 pb-4 pt-6 print:pt-4">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-[#14130f]">
            <span className="border border-[#14130f] bg-[#14130f] px-2 py-0.5 text-[#f1ebdc]">
              {r.classification}
            </span>
            <span>Ministry of Internal Affairs · Republic of Kazakhstan</span>
            <span>CIB-04</span>
          </div>

          {/* Title block */}
          <div className="mt-6 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b6353]">Case File</div>
              <h1
                className="mt-1 leading-[1.05] text-[#14130f]"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic", fontSize: "44px" }}
              >
                {r.title}
              </h1>
              <div className="mt-2 font-mono text-[12px] tracking-[0.04em] text-[#3a362f]">
                Ref&nbsp;<span className="font-bold">{r.id}</span> · Case&nbsp;<span className="font-bold">#{r.caseId}</span> · Filed by&nbsp;{r.author}
              </div>
            </div>
            {/* Stamped seal */}
            <div
              className="grid h-24 w-24 shrink-0 place-items-center border-2 border-[#9a3412] text-center"
              style={{ transform: "rotate(-6deg)" }}
            >
              <div className="font-mono text-[#9a3412]">
                <div className="text-[9.5px] uppercase tracking-[0.18em]">Filed</div>
                <div className="my-1 h-px bg-[#9a3412]" />
                <div className="text-[14px] font-bold leading-none">{r.risk.toUpperCase()}</div>
                <div className="my-1 h-px bg-[#9a3412]" />
                <div className="text-[9px] tracking-[0.16em]">{r.created.slice(0, 10)}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="px-10 pb-10 pt-8">
          {/* Synopsis */}
          <section>
            <SectionMark n="§ 1" label="Synopsis" />
            <p
              className="mt-3 text-[15.5px] leading-[1.55] text-[#1c1a15]"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              {r.summary}
            </p>
          </section>

          {/* Sections */}
          {r.sections.map((s, i) => (
            <section key={i} className="mt-6">
              <SectionMark n={`§ ${i + 2}`} label={s.heading} />
              <p className="mt-2 text-[13.5px] leading-[1.7] text-[#14130f]">{s.body}</p>
            </section>
          ))}

          {/* Subjects of interest — redacted */}
          {linkedEntities.length > 0 && (
            <section className="mt-7">
              <SectionMark n={`§ ${r.sections.length + 2}`} label="Subjects of interest" />
              <table className="mt-3 w-full font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-[#14130f] text-[10px] uppercase tracking-[0.16em] text-[#6b6353]">
                    <th className="py-1.5 text-left font-bold">Slug</th>
                    <th className="py-1.5 text-left font-bold">Designation</th>
                    <th className="py-1.5 text-left font-bold">Kind</th>
                    <th className="py-1.5 text-right font-bold">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedEntities.map((e) => (
                    <tr key={e.id} className="border-b border-[#c9bfa8]">
                      <td className="py-1.5 align-baseline tracking-[0.1em] text-[#6b6353]">
                        {e.id.replace(/^e-/, "SH-2026-").toUpperCase()}
                      </td>
                      <td className="py-1.5 align-baseline">
                        <span className="font-bold">{e.label}</span>
                        {e.alias && (
                          <span className="ml-2 text-[#3a362f]">
                            ⟨<RedactBar text={e.alias} />⟩
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 align-baseline uppercase tracking-[0.1em] text-[#3a362f]">{e.kind}</td>
                      <td className="py-1.5 text-right align-baseline font-bold">
                        R{e.riskScore.toString().padStart(2, "0")} · {e.risk.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9a3412]">
                Aliases redacted per MIA disclosure policy §4.2
              </p>
            </section>
          )}

          {/* Evidence ledger */}
          {linkedEvidence.length > 0 && (
            <section className="mt-7">
              <SectionMark n={`§ ${r.sections.length + 3}`} label="Evidence ledger" />
              <ol className="mt-3 space-y-2 font-mono text-[12px]">
                {linkedEvidence.map((ev, i) => (
                  <li key={ev.id} className="grid grid-cols-[auto_auto_1fr] gap-3 border-l-2 border-[#14130f] pl-3">
                    <span className="text-[#6b6353]">{String(i + 1).padStart(2, "0")}.</span>
                    <span className="font-bold">{ev.id}</span>
                    <span>
                      <span className="text-[#3a362f]">{ev.time}</span> · {ev.source} · {ev.finding}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Signature block */}
          <section className="mt-10 grid grid-cols-2 gap-6 border-t border-[#14130f] pt-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6353]">Authoring officer</div>
              <div
                className="mt-3 text-[22px] leading-tight text-[#14130f]"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
              >
                {r.author}
              </div>
              <div className="mt-1 border-t border-[#14130f] pt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#3a362f]">
                signature · {r.created.slice(0, 10)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6353]">Document hash</div>
              <div className="mt-3 font-mono text-[15px] tracking-[0.22em] text-[#14130f]">
                {docHash.slice(0, 4)} · {docHash.slice(4, 8)} · {docHash.slice(8, 12)} · {docHash.slice(12, 16)}
              </div>
              <div className="mt-1 border-t border-[#14130f] pt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#3a362f]">
                sha-256 · truncated 16
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t-2 border-[#14130f] px-10 py-3">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#3a362f]">
            <span>Pages 1 / {r.pages}</span>
            <span className="bg-[#14130f] px-2 py-0.5 text-[#f1ebdc]">{r.classification}</span>
            <span>Generated {printDate}</span>
          </div>
        </footer>
      </article>

      {/* Print rules */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-[#14130f] pb-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#9a3412]">{n}</span>
      <h2
        className="text-[18px] text-[#14130f]"
        style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
      >
        {label}
      </h2>
    </div>
  );
}

function RedactBar({ text }: { text: string }) {
  return (
    <span
      className="mx-0.5 inline-block translate-y-[1px] bg-[#14130f] align-middle"
      style={{ width: `${Math.max(2.4, text.length * 0.55)}ch`, height: "0.95em" }}
      aria-label="redacted"
      title="Redacted"
    >
      <span className="invisible">{text}</span>
    </span>
  );
}