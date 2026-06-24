import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CASES, ENTITIES, LOG_ROWS, type Report } from "./data";
import { useReportsStore, maxRisk } from "./reportsStore";
import { RiskBadge } from "./atoms";
import { FileBadge, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

type Template = "briefing" | "deep-dive" | "audit" | "custom";

const TEMPLATE_LABEL: Record<Template, string> = {
  briefing: "Weekly briefing",
  "deep-dive": "Cluster deep dive",
  audit: "Coordination audit",
  custom: "Custom (blank)",
};

const CLASSIFICATIONS = [
  "RESTRICTED // MIA-INTERNAL",
  "RESTRICTED",
  "CONFIDENTIAL // CIB-04",
  "OFFICIAL · UNCLASSIFIED",
] as const;

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newReportId(caseId: string) {
  const suffix = caseId.split("-").pop() ?? "0000";
  const seq = Math.floor(100 + Math.random() * 899);
  return `RPT-${suffix}-${seq}`;
}

function buildSections(
  template: Template,
  pickedEntities: typeof ENTITIES,
  pickedEvidence: typeof LOG_ROWS,
  customBody: string,
): Report["sections"] {
  const entSummary = pickedEntities.length
    ? pickedEntities.map((e) => `${e.label}${e.alias ? ` (${e.alias})` : ""} — risk ${e.riskScore}, confidence ${e.confidence}%`).join("; ")
    : "No entities attached.";
  const evSummary = pickedEvidence.length
    ? pickedEvidence.map((ev) => `${ev.id}: ${ev.finding}`).join(" | ")
    : "No evidence rows attached.";

  if (template === "custom") {
    return [{ heading: "Analyst notes", body: customBody || "—" }];
  }

  if (template === "briefing") {
    return [
      { heading: "Operational picture", body: `Briefing covers ${pickedEntities.length} entities and ${pickedEvidence.length} evidence rows. ${entSummary}` },
      { heading: "AI inference summary", body: `Behavioural correlation across attached nodes shows aggregate risk ${maxRisk(pickedEntities.map((e) => e.risk)).toUpperCase()}. ${pickedEntities.length ? `Lead node: ${pickedEntities[0].label}.` : ""}` },
      { heading: "Recommended next steps", body: `1) Validate ${pickedEvidence.length} new evidence rows. 2) Expand watch window on top-risk entities. 3) Cross-link with adjacent cases. 4) Schedule review with CIB-04 desk.` },
      ...(customBody ? [{ heading: "Analyst notes", body: customBody }] : []),
    ];
  }

  if (template === "deep-dive") {
    return [
      { heading: "Scope", body: `Deep-dive on ${pickedEntities.length} primary entities. ${entSummary}` },
      { heading: "Evidence trail", body: evSummary },
      { heading: "Reliability assessment", body: `Average source reliability across selection: ${avgReliability(pickedEntities)}. Confidence on lead identifiers ≥ ${Math.max(0, ...pickedEntities.map((e) => e.confidence))}%.` },
      ...(customBody ? [{ heading: "Analyst notes", body: customBody }] : []),
    ];
  }

  // audit
  return [
    { heading: "Audit coverage", body: `Reviewed ${pickedEntities.length} entities and ${pickedEvidence.length} evidence rows for coordination signals.` },
    { heading: "Findings", body: pickedEvidence.length ? evSummary : "No anomalies above baseline." },
    ...(customBody ? [{ heading: "Analyst notes", body: customBody }] : []),
  ];
}

function avgReliability(ents: typeof ENTITIES): string {
  if (!ents.length) return "n/a";
  const map = { A: 4, B: 3, C: 2, D: 1 } as const;
  const avg = ents.reduce((s, e) => s + map[e.reliability], 0) / ents.length;
  return avg >= 3.5 ? "A" : avg >= 2.5 ? "B" : avg >= 1.5 ? "C" : "D";
}

export function NewReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const add = useReportsStore((s) => s.add);

  const [title, setTitle] = useState("");
  const [caseId, setCaseId] = useState<string>(CASES[0].id);
  const [template, setTemplate] = useState<Template>("briefing");
  const [classification, setClassification] = useState<string>(CLASSIFICATIONS[0]);
  const [author, setAuthor] = useState("Analyst · CIB-04");
  const [summary, setSummary] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickedEntities = useMemo(() => ENTITIES.filter((e) => entityIds.includes(e.id)), [entityIds]);
  const pickedEvidence = useMemo(() => LOG_ROWS.filter((e) => evidenceIds.includes(e.id)), [evidenceIds]);
  const derivedRisk = useMemo(() => maxRisk(pickedEntities.map((e) => e.risk)), [pickedEntities]);

  function reset() {
    setTitle(""); setCaseId(CASES[0].id); setTemplate("briefing");
    setClassification(CLASSIFICATIONS[0]); setAuthor("Analyst · CIB-04");
    setSummary(""); setCustomBody(""); setEntityIds([]); setEvidenceIds([]);
  }

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function suggestTitle() {
    const c = CASES.find((x) => x.id === caseId);
    const stamp = new Date().toLocaleDateString("en-CA");
    setTitle(`Case ${caseId} · ${TEMPLATE_LABEL[template]} · ${stamp}`);
    void c;
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    setSubmitting(true);
    const sections = buildSections(template, pickedEntities, pickedEvidence, customBody);
    const pages = Math.max(3, sections.length + Math.ceil(pickedEntities.length / 4) + Math.ceil(pickedEvidence.length / 6));
    const generated: Report = {
      id: newReportId(caseId),
      title: title.trim(),
      created: nowStamp(),
      state: "review",
      risk: derivedRisk,
      pages,
      caseId,
      author: author.trim() || "Analyst · CIB-04",
      classification,
      summary: summary.trim() || `Auto-generated ${TEMPLATE_LABEL[template].toLowerCase()} bundling ${pickedEntities.length} entities and ${pickedEvidence.length} evidence rows for case ${caseId}.`,
      sections,
      entityIds,
      evidenceIds,
    };
    add(generated);
    toast.success(`${generated.id} drafted · opening report`);
    reset();
    onOpenChange(false);
    setSubmitting(false);
    navigate({ to: "/reports/$id", params: { id: generated.id } });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl border-border bg-card p-0 sm:rounded-none">
        <DialogHeader className="border-b border-border bg-background/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileBadge size={14} className="text-primary" />
            <DialogTitle className="text-[14px] font-bold tracking-wide text-foreground">New investigation report</DialogTitle>
          </div>
          <DialogDescription className="mono text-[11.5px] text-muted-foreground">
            Draft a forensic briefing. Selected entities and evidence are auto-bundled into structured sections.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[68vh] grid-cols-1 gap-0 overflow-hidden sm:grid-cols-[1fr_280px]">
          {/* Left: form */}
          <ScrollArea className="max-h-[68vh] px-5 py-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="dossier-label text-[11px]">Title</Label>
                  <button type="button" onClick={suggestTitle} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                    <Sparkles size={10} /> suggest
                  </button>
                </div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cluster KZ-FIU-118 weekly briefing" className="mono mt-1 rounded-none border-border bg-background text-[13px]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="dossier-label text-[11px]">Case</Label>
                  <Select value={caseId} onValueChange={setCaseId}>
                    <SelectTrigger className="mono mt-1 h-9 rounded-none border-border bg-background text-[12.5px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CASES.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="mono text-[12.5px]">
                          {c.id} — {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="dossier-label text-[11px]">Template</Label>
                  <Select value={template} onValueChange={(v) => setTemplate(v as Template)}>
                    <SelectTrigger className="mono mt-1 h-9 rounded-none border-border bg-background text-[12.5px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TEMPLATE_LABEL) as Template[]).map((t) => (
                        <SelectItem key={t} value={t} className="text-[12.5px]">{TEMPLATE_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="dossier-label text-[11px]">Classification</Label>
                  <Select value={classification} onValueChange={setClassification}>
                    <SelectTrigger className="mono mt-1 h-9 rounded-none border-border bg-background text-[12.5px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLASSIFICATIONS.map((c) => <SelectItem key={c} value={c} className="mono text-[12px]">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="dossier-label text-[11px]">Author</Label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="mono mt-1 h-9 rounded-none border-border bg-background text-[12.5px]" />
                </div>
              </div>

              <div>
                <Label className="dossier-label text-[11px]">Executive summary <span className="text-muted-foreground">(optional — auto-generated if blank)</span></Label>
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="One paragraph framing the briefing…" className="mt-1 rounded-none border-border bg-background text-[13px]" />
              </div>

              {template === "custom" && (
                <div>
                  <Label className="dossier-label text-[11px]">Body</Label>
                  <Textarea value={customBody} onChange={(e) => setCustomBody(e.target.value)} rows={5} placeholder="Free-form section body…" className="mt-1 rounded-none border-border bg-background text-[13px]" />
                </div>
              )}
              {template !== "custom" && (
                <div>
                  <Label className="dossier-label text-[11px]">Analyst notes <span className="text-muted-foreground">(appended as final section)</span></Label>
                  <Textarea value={customBody} onChange={(e) => setCustomBody(e.target.value)} rows={3} className="mt-1 rounded-none border-border bg-background text-[13px]" />
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="dossier-label text-[11px]">Attached entities <span className="text-muted-foreground">({entityIds.length})</span></Label>
                  <button type="button" onClick={() => setEntityIds(entityIds.length === ENTITIES.length ? [] : ENTITIES.map((e) => e.id))} className="text-[11px] text-primary hover:underline">
                    {entityIds.length === ENTITIES.length ? "clear" : "select all"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1 rounded-none border border-border bg-background/40 p-1.5 sm:grid-cols-2">
                  {ENTITIES.map((e) => (
                    <label key={e.id} className="flex cursor-pointer items-center gap-2 px-1.5 py-1 hover:bg-background">
                      <Checkbox checked={entityIds.includes(e.id)} onCheckedChange={() => toggle(entityIds, setEntityIds, e.id)} className="rounded-none border-border" />
                      <span className="mono shrink-0 text-[10.5px] text-muted-foreground">{e.id}</span>
                      <span className="truncate text-[12px] text-foreground">{e.label}</span>
                      <span className="ml-auto"><RiskBadge risk={e.risk} /></span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="dossier-label text-[11px]">Attached evidence <span className="text-muted-foreground">({evidenceIds.length})</span></Label>
                  <button type="button" onClick={() => setEvidenceIds(evidenceIds.length === LOG_ROWS.length ? [] : LOG_ROWS.map((e) => e.id))} className="text-[11px] text-primary hover:underline">
                    {evidenceIds.length === LOG_ROWS.length ? "clear" : "select all"}
                  </button>
                </div>
                <div className="max-h-56 overflow-auto rounded-none border border-border bg-background/40 p-1.5">
                  {LOG_ROWS.map((ev) => (
                    <label key={ev.id} className="flex cursor-pointer items-start gap-2 px-1.5 py-1 hover:bg-background">
                      <Checkbox checked={evidenceIds.includes(ev.id)} onCheckedChange={() => toggle(evidenceIds, setEvidenceIds, ev.id)} className="mt-0.5 rounded-none border-border" />
                      <span className="mono shrink-0 text-[10.5px] text-muted-foreground">{ev.id}</span>
                      <span className="line-clamp-1 flex-1 text-[12px] text-foreground">{ev.finding}</span>
                      <span className="ml-1"><RiskBadge risk={ev.risk} /></span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Right: preview */}
          <aside className="hidden border-l border-border bg-background/30 px-4 py-4 sm:block">
            <div className="dossier-label text-[11px] text-muted-foreground">Preview</div>
            <div className="mt-2 space-y-3">
              <div className="mono text-[11px] text-primary">{classification}</div>
              <div className="text-[13px] font-bold text-foreground">{title || "Untitled briefing"}</div>
              <div className="mono text-[11px] text-muted-foreground">{caseId} · {TEMPLATE_LABEL[template]}</div>
              <div className="flex items-center gap-2 text-[11.5px]">
                <span className="dossier-label text-muted-foreground">risk</span>
                <RiskBadge risk={derivedRisk} />
              </div>
              <div className="space-y-1 border-t border-border pt-2 text-[11.5px]">
                <Row k="entities" v={String(pickedEntities.length)} />
                <Row k="evidence" v={String(pickedEvidence.length)} />
                <Row k="sections" v={String(buildSections(template, pickedEntities, pickedEvidence, customBody).length)} />
                <Row k="author" v={author} />
              </div>
              <p className="border-t border-border pt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                Once drafted, the report appears in the Reports list (state: review) and can be exported to PDF or the formal dossier view.
              </p>
            </div>
          </aside>
        </div>

        <DialogFooter className="border-t border-border bg-background/40 px-5 py-3">
          <button onClick={() => { reset(); onOpenChange(false); }} className="h-8 rounded-none border border-border bg-background px-3 text-[12.5px] text-foreground/80 hover:border-muted-foreground/40 hover:text-foreground">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="h-8 rounded-none bg-primary px-3 text-[12.5px] font-bold text-primary-foreground hover:bg-primary disabled:opacity-60">
            Generate report
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="dossier-label text-muted-foreground">{k}</span>
      <span className="mono truncate text-foreground">{v}</span>
    </div>
  );
}