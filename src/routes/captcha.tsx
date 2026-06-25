import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader, StatusChip } from "@/components/sentinel/atoms";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, Play, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  CircleDot, Loader2, Ban, Lock, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createCaptchaJob, fetchCaptchaJob, fetchCaptchaAudit,
  isTerminal, TEST_PROFILES, CAPTCHA_TYPES,
  type CaptchaJob, type CaptchaStatus, type CaptchaType, type CaptchaAuditEntry,
} from "@/lib/captchaApi";

export const Route = createFileRoute("/captcha")({
  head: () => ({ meta: [
    { title: "QA · CAPTCHA · Shadowless" },
    { name: "description", content: "QA-панель CAPTCHA: dry-run проверки на allowlisted доменах." },
  ]}),
  component: CaptchaPage,
});

// ── persistence ──────────────────────────────────────────────────────────────
const HISTORY_KEY = "shadowless.captcha.history.v1";
const MAX_HISTORY = 25;

function loadHistory(): CaptchaJob[] {
  if (typeof window === "undefined") return [];
  try {
    const v = window.localStorage.getItem(HISTORY_KEY);
    if (!v) return [];
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveHistory(rows: CaptchaJob[]) {
  try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, MAX_HISTORY))); } catch {}
}

// ── status meta ──────────────────────────────────────────────────────────────
const STATUS_META: Record<CaptchaStatus, { label: string; tone: "neutral"|"good"|"warn"|"bad"; icon: typeof CircleDot }> = {
  queued:   { label: "В очереди",  tone: "neutral", icon: CircleDot },
  running:  { label: "Выполняется", tone: "warn",    icon: Loader2 },
  solved:   { label: "Завершено",   tone: "good",    icon: CheckCircle2 },
  failed:   { label: "Ошибка",      tone: "bad",     icon: XCircle },
  rejected: { label: "Отклонено",   tone: "bad",     icon: Ban },
};

const CAPTCHA_LABEL: Record<CaptchaType, string> = {
  auto: "Авто-детект",
  recaptcha_v2: "reCAPTCHA v2",
  hcaptcha: "hCaptcha",
  turnstile: "Turnstile",
  image_captcha: "Image CAPTCHA",
  funcaptcha: "FunCaptcha",
  geetest: "GeeTest",
};

function todayKey(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().slice(0, 10);
}

// ── page ─────────────────────────────────────────────────────────────────────
function CaptchaPage() {
  const [history, setHistory] = useState<CaptchaJob[]>(() => loadHistory());
  const [activeId, setActiveId] = useState<string | null>(() => loadHistory()[0]?.id ?? null);
  const active = useMemo(() => history.find((h) => h.id === activeId) ?? null, [history, activeId]);

  // form
  const [pageUrl, setPageUrl] = useState("https://shadowless.lovable.app");
  const [captchaType, setCaptchaType] = useState<CaptchaType>("auto");
  const [profile, setProfile] = useState<string>(TEST_PROFILES[0].id);
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAck, setConfirmAck] = useState(false);

  const pollRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  useEffect(() => () => { pollRef.current.cancelled = true; }, []);

  useEffect(() => { saveHistory(history); }, [history]);

  const upsertJob = (job: CaptchaJob) => {
    setHistory((prev) => {
      const idx = prev.findIndex((p) => p.id === job.id);
      if (idx === -1) return [job, ...prev].slice(0, MAX_HISTORY);
      const next = prev.slice();
      next[idx] = { ...next[idx], ...job };
      return next;
    });
  };

  const startPolling = (id: string) => {
    pollRef.current.cancelled = false;
    const flag = pollRef.current;
    (async () => {
      const started = Date.now();
      while (!flag.cancelled) {
        await new Promise((r) => setTimeout(r, 2000));
        if (flag.cancelled) return;
        if (Date.now() - started > 5 * 60_000) return; // 5 min safety
        try {
          const j = await fetchCaptchaJob(id);
          upsertJob(j);
          if (isTerminal(j.status)) return;
        } catch (e) {
          // keep polling unless 404-ish; soft-fail
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    })();
  };

  const validUrl = (() => {
    try { const u = new URL(pageUrl); return u.protocol === "http:" || u.protocol === "https:"; }
    catch { return false; }
  })();

  const submit = async () => {
    if (!validUrl || busy) return;
    setBusy(true);
    try {
      const job = await createCaptchaJob({
        page_url: pageUrl.trim(),
        captcha_type: captchaType,
        test_profile_id: profile,
        dry_run: dryRun,
      });
      upsertJob(job);
      setActiveId(job.id);
      toast.success(`Задача ${job.id.slice(0, 8)} принята · ${STATUS_META[job.status].label}`);
      if (!isTerminal(job.status)) startPolling(job.id);
    } catch (e) {
      toast.error(`Не удалось создать задачу: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      setConfirmOpen(false);
      setConfirmAck(false);
    }
  };

  const onRun = () => {
    if (!validUrl) { toast.error("Укажите корректный URL"); return; }
    if (dryRun) submit(); else setConfirmOpen(true);
  };

  // dashboard counters
  const counters = useMemo(() => {
    const today = todayKey();
    let jobsToday = 0, rejected = 0, dryDetect = 0, providerFails = 0;
    for (const j of history) {
      const day = j.updated_at ? todayKey(j.updated_at) : today;
      if (day === today) jobsToday++;
      if (j.status === "rejected") rejected++;
      if (j.dry_run && j.status === "solved") dryDetect++;
      if (j.status === "failed" && (j.error_code?.startsWith("provider") ?? false)) providerFails++;
    }
    const breaker: "closed" | "open" | "half" = providerFails >= 3 ? "open" : providerFails === 0 ? "closed" : "half";
    return { jobsToday, rejected, dryDetect, providerFails, breaker };
  }, [history]);

  const targetDomain = (() => { try { return new URL(pageUrl).hostname; } catch { return pageUrl; } })();

  return (
    <AppShell>
      <PageShell
        title="QA · CAPTCHA"
        subtitle="Безопасные dry-run и detection-задачи на allowlisted доменах"
        actions={<RoleBadge />}
      >
        {/* Security notice */}
        <div className="mb-3 flex items-start gap-2.5 rounded-sm border border-[color:var(--risk-medium)]/40 bg-[color:var(--risk-medium)]/10 p-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[color:var(--risk-medium)]" />
          <div className="text-[12.5px] leading-relaxed text-foreground/90">
            <div className="font-semibold text-[color:var(--risk-medium)]">Только для собственных или письменно разрешённых доменов.</div>
            Секреты и CAPTCHA-токены не отображаются и не сохраняются в интерфейсе. Ключи провайдера хранятся только на бэкенде.
          </div>
        </div>

        {/* Dashboard counters */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Counter label="Задач сегодня"      value={counters.jobsToday}     icon={Activity} />
          <Counter label="Отклонено"          value={counters.rejected}      icon={Ban}     tone={counters.rejected > 0 ? "bad" : "neutral"} />
          <Counter label="Dry-run detections" value={counters.dryDetect}     icon={CheckCircle2} tone="good" />
          <Counter label="Сбои провайдера"    value={counters.providerFails} icon={AlertTriangle} tone={counters.providerFails > 0 ? "warn" : "neutral"} />
          <BreakerCard state={counters.breaker} />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Form */}
          <Panel>
            <PanelHeader title="Новая задача" right={<Lock size={13} className="text-primary" />} />
            <div className="space-y-3 p-3">
              <Field label="URL страницы">
                <Input
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  placeholder="https://..."
                  className={cn("h-9 font-mono text-[13px]", !validUrl && "border-destructive")}
                />
                {!validUrl && <div className="mt-1 text-[11.5px] text-destructive">Введите корректный http/https URL.</div>}
              </Field>

              <Field label="Тип CAPTCHA">
                <Select value={captchaType} onValueChange={(v) => setCaptchaType(v as CaptchaType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAPTCHA_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>{CAPTCHA_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Профиль теста">
                <Select value={profile} onValueChange={setProfile}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEST_PROFILES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex items-center justify-between rounded-sm border border-border bg-background px-3 py-2">
                <div>
                  <div className="text-[13px] font-medium text-foreground">Dry-run</div>
                  <div className="text-[11.5px] text-muted-foreground">Только детектирование, без вызова провайдера.</div>
                </div>
                <Switch checked={dryRun} onCheckedChange={setDryRun} />
              </div>

              {!dryRun && (
                <div className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 p-2.5 text-[12px] text-destructive">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  Реальный provider будет вызван. Требуется подтверждение разрешения.
                </div>
              )}

              <Button
                onClick={onRun}
                disabled={busy || !validUrl}
                className="h-9 w-full gap-1.5 text-[13px] font-semibold"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {busy ? "Отправка…" : "Создать задачу"}
              </Button>
            </div>
          </Panel>

          {/* Active job */}
          <Panel>
            <PanelHeader
              title={active ? `Задача · ${active.id.slice(0, 8)}` : "Статус задачи"}
              hint={active ? active.domain : "Нет активной задачи"}
              right={active && (
                <button
                  onClick={async () => {
                    try { upsertJob(await fetchCaptchaJob(active.id)); } catch (e) { toast.error((e as Error).message); }
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-background px-2 text-[11.5px] text-foreground/80 hover:border-primary hover:text-primary"
                >
                  <RefreshCw size={11} /> обновить
                </button>
              )}
            />
            {active ? <JobDetail job={active} /> : (
              <div className="flex h-48 items-center justify-center text-[13px] text-muted-foreground">
                Заполните форму и создайте задачу.
              </div>
            )}
          </Panel>
        </div>

        {/* History */}
        <Panel className="mt-3">
          <PanelHeader title="История задач" hint={`${history.length} записей`} />
          {history.length === 0 ? (
            <div className="px-3 py-8 text-center text-[13px] text-muted-foreground">Пока пусто.</div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((j) => {
                const M = STATUS_META[j.status];
                const Icon = M.icon;
                return (
                  <button
                    key={j.id}
                    onClick={() => setActiveId(j.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary",
                      j.id === activeId && "bg-primary/10",
                    )}
                  >
                    <Icon size={14} className={cn(
                      "shrink-0",
                      M.tone === "good" && "text-primary",
                      M.tone === "warn" && "text-[color:var(--risk-medium)]",
                      M.tone === "bad"  && "text-destructive",
                      M.tone === "neutral" && "text-muted-foreground",
                      j.status === "running" && "animate-spin",
                    )} />
                    <span className="mono w-20 shrink-0 text-[12px] text-foreground">{j.id.slice(0, 8)}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/80">{j.domain}</span>
                    <span className="hidden sm:inline text-[11.5px] text-muted-foreground">{CAPTCHA_LABEL[j.captcha_type]}</span>
                    {j.dry_run && <StatusChip tone="neutral">dry-run</StatusChip>}
                    <StatusChip tone={M.tone}>{M.label}</StatusChip>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Confirm non-dry-run */}
        <Dialog open={confirmOpen} onOpenChange={(v) => { setConfirmOpen(v); if (!v) setConfirmAck(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение реального запуска</DialogTitle>
              <DialogDescription>
                Будет вызван реальный provider. Это допустимо только для собственных или письменно разрешённых стендов.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-sm border border-border bg-secondary p-3 text-[13px]">
              <KV k="Домен" v={targetDomain} />
              <KV k="Профиль" v={TEST_PROFILES.find((p) => p.id === profile)?.label ?? profile} />
              <KV k="Provider" v="как настроено на backend" />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-[13px] text-foreground">
              <Checkbox checked={confirmAck} onCheckedChange={(v) => setConfirmAck(v === true)} className="mt-0.5" />
              <span>У меня есть письменное разрешение владельца домена на этот тест.</span>
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Отмена</Button>
              <Button onClick={submit} disabled={!confirmAck || busy}>Подтвердить и запустить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    </AppShell>
  );
}

// ── job detail with audit trail ──────────────────────────────────────────────
function JobDetail({ job }: { job: CaptchaJob }) {
  const M = STATUS_META[job.status];
  const Icon = M.icon;
  const [audit, setAudit] = useState<CaptchaAuditEntry[] | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadAudit = async () => {
    setAuditLoading(true);
    try { const r = await fetchCaptchaAudit(job.id); setAudit(r.entries || []); }
    catch (e) { toast.error(`Audit: ${(e as Error).message}`); }
    finally { setAuditLoading(false); }
  };

  useEffect(() => { setAudit(null); if (isTerminal(job.status)) loadAudit(); /* eslint-disable-next-line */ }, [job.id, job.status]);

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-3 rounded-sm border border-border bg-background p-3">
        <Icon size={22} className={cn(
          M.tone === "good" && "text-primary",
          M.tone === "warn" && "text-[color:var(--risk-medium)]",
          M.tone === "bad"  && "text-destructive",
          M.tone === "neutral" && "text-muted-foreground",
          job.status === "running" && "animate-spin",
        )} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-foreground">{M.label}</span>
            {job.dry_run && <StatusChip tone="neutral">dry-run</StatusChip>}
            <StatusChip tone="neutral">{job.provider}</StatusChip>
          </div>
          <div className="mono mt-0.5 truncate text-[11.5px] text-muted-foreground">{job.id}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <KV k="Домен" v={job.domain} />
        <KV k="Тип" v={CAPTCHA_LABEL[job.captcha_type]} />
        <KV k="Profile" v={job.test_profile_id ?? "—"} />
        <KV k="URL" v={job.page_url ?? "—"} mono />
      </div>

      {job.status === "rejected" && (
        <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-[12.5px]">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-destructive">
            <Ban size={13} /> Задача отклонена
          </div>
          <KV k="error_code" v={job.error_code ?? "—"} mono />
          <KV k="message" v={job.error_message_sanitized ?? "—"} />
        </div>
      )}
      {job.status === "failed" && (
        <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-[12.5px]">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-destructive">
            <XCircle size={13} /> Ошибка выполнения
          </div>
          <KV k="error_code" v={job.error_code ?? "—"} mono />
          <KV k="message" v={job.error_message_sanitized ?? "—"} />
        </div>
      )}

      {/* Audit */}
      <div className="rounded-sm border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-foreground/80">Audit trail</span>
          <button
            onClick={loadAudit}
            disabled={auditLoading}
            className="inline-flex h-6 items-center gap-1 rounded-sm border border-border bg-secondary px-1.5 text-[11px] text-foreground/80 hover:border-primary hover:text-primary"
          >
            {auditLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />} обновить
          </button>
        </div>
        {audit === null ? (
          <div className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">
            {isTerminal(job.status) ? "Загрузка…" : "Доступно после завершения задачи."}
          </div>
        ) : audit.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">Записей нет.</div>
        ) : (
          <ol className="divide-y divide-border">
            {audit.map((e, i) => (
              <li key={i} className="flex gap-3 px-3 py-2">
                <span className="mono w-40 shrink-0 text-[11.5px] text-muted-foreground">{e.ts}</span>
                <span className="text-[12.5px] font-semibold text-foreground">{e.event}</span>
                {e.detail && <span className="truncate text-[12px] text-muted-foreground">{e.detail}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ── small atoms ──────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function KV({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-1 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{k}</span>
      <span className={cn("max-w-[60%] truncate text-[12.5px] text-foreground", mono && "mono")}>{v}</span>
    </div>
  );
}

function Counter({ label, value, icon: Icon, tone = "neutral" }: {
  label: string; value: number; icon: typeof Activity; tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const color =
    tone === "good" ? "text-primary" :
    tone === "warn" ? "text-[color:var(--risk-medium)]" :
    tone === "bad"  ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-sm border border-border bg-secondary p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
        <Icon size={13} className={color} />
      </div>
      <div className={cn("mono mt-1 text-[22px] font-semibold leading-none", color)}>{value}</div>
    </div>
  );
}

function BreakerCard({ state }: { state: "closed" | "open" | "half" }) {
  const meta = state === "open"
    ? { label: "OPEN",   tone: "text-destructive",                bg: "border-destructive/40 bg-destructive/10",                 hint: "блокирует вызовы" }
    : state === "half"
    ? { label: "HALF",   tone: "text-[color:var(--risk-medium)]", bg: "border-[color:var(--risk-medium)]/40 bg-[color:var(--risk-medium)]/10", hint: "тест восстановления" }
    : { label: "CLOSED", tone: "text-primary",                    bg: "border-border bg-secondary",                              hint: "норма" };
  return (
    <div className={cn("rounded-sm border p-3", meta.bg)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Circuit breaker</span>
        <ShieldAlert size={13} className={meta.tone} />
      </div>
      <div className={cn("mono mt-1 text-[18px] font-semibold leading-none", meta.tone)}>{meta.label}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{meta.hint}</div>
    </div>
  );
}

function RoleBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
      <Lock size={11} /> Operator · L3
    </span>
  );
}
