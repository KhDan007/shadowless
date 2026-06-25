import { API_BASE } from "./config";

export type CaptchaType =
  | "auto"
  | "recaptcha_v2"
  | "hcaptcha"
  | "turnstile"
  | "image_captcha"
  | "funcaptcha"
  | "geetest";

export type CaptchaStatus = "queued" | "running" | "solved" | "failed" | "rejected";

export interface CaptchaJob {
  id: string;
  status: CaptchaStatus;
  domain: string;
  captcha_type: CaptchaType;
  dry_run: boolean;
  provider: string;
  error_code: string | null;
  error_message_sanitized: string | null;
  created_at?: string;
  updated_at?: string;
  page_url?: string;
  test_profile_id?: string;
}

export interface CaptchaAuditEntry {
  ts: string;
  event: string;
  detail?: string;
}

export interface CaptchaAuditResponse {
  job_id: string;
  entries: CaptchaAuditEntry[];
}

export interface CreateCaptchaJobInput {
  page_url: string;
  captcha_type: CaptchaType;
  test_profile_id: string;
  dry_run: boolean;
}

const BASE = `${API_BASE}/api/v1/captcha-jobs`;

export async function createCaptchaJob(input: CreateCaptchaJobInput): Promise<CaptchaJob> {
  const r = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`captcha job failed: ${r.status} ${txt}`.trim());
  }
  return r.json();
}

export async function fetchCaptchaJob(id: string): Promise<CaptchaJob> {
  const r = await fetch(`${BASE}/${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error(`captcha status failed: ${r.status}`);
  return r.json();
}

export async function fetchCaptchaAudit(id: string): Promise<CaptchaAuditResponse> {
  const r = await fetch(`${BASE}/${encodeURIComponent(id)}/audit`);
  if (!r.ok) throw new Error(`captcha audit failed: ${r.status}`);
  return r.json();
}

export const TERMINAL_STATUSES: CaptchaStatus[] = ["solved", "failed", "rejected"];
export const isTerminal = (s: CaptchaStatus) => TERMINAL_STATUSES.includes(s);

export const TEST_PROFILES: { id: string; label: string }[] = [
  { id: "qa-demo",    label: "QA Demo (mock)" },
  { id: "qa-staging", label: "QA Staging" },
  { id: "qa-canary",  label: "QA Canary" },
];

export const CAPTCHA_TYPES: CaptchaType[] = [
  "auto", "recaptcha_v2", "hcaptcha", "turnstile", "image_captcha", "funcaptcha", "geetest",
];
