import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Project-wide glossary for technical / domain jargon. Hovering a term shows
 * a one-line plain-language definition so non-specialist operators (and
 * onboarding analysts) can read any panel without leaving the screen.
 *
 * Keys are matched case-insensitively as whole words. Multi-word entries
 * (e.g. "chain of custody") are supported.
 */
export const GLOSSARY: Record<string, string> = {
  // OSINT / investigation
  osint: "Open-source intelligence — information collected from public sources (web, social, leaks).",
  dossier: "A compiled case file for a single entity — identity, links, evidence, risk.",
  entity: "Any tracked actor or object in the case: person, wallet, account, IP, device.",
  edge: "A relationship between two entities on the graph (transfer, message, co-location, etc.).",
  node: "An entity drawn as a circle on the graph.",
  vetted: "Edge confirmed by an analyst — ≥ 90% confidence, treated as reliable.",
  confidence: "How sure the system is that a link or finding is real (0–100%).",
  "risk score": "Composite 0–100 score combining behavior, links, and intel signals.",
  "chain of custody": "Audit trail proving evidence was not tampered with from collection to court.",
  redact: "Hide or mask sensitive fields before sharing or exporting evidence.",
  takedown: "Formal request to remove illegal content from a platform.",
  acked: "Acknowledged — an analyst has seen the alert and accepted ownership.",
  alert: "System-raised notification that needs analyst attention.",
  crawler: "Automated collector that pulls posts, transactions, or feeds from a source.",
  "command palette": "Keyboard launcher (⌘K) for searching entities, evidence and actions.",

  // Crypto / finance
  btc: "Bitcoin — pseudonymous cryptocurrency tracked by on-chain addresses.",
  wallet: "An address or set of addresses controlled by one actor on a blockchain.",
  mixer: "Service that pools and shuffles crypto to break the link between sender and receiver.",
  "mixer-adjacent": "Transaction one hop away from a known mixer — high laundering signal.",
  exchange: "Platform that converts crypto to fiat — usually requires KYC.",
  kyc: "Know Your Customer — identity verification required by regulated platforms.",
  fiu: "Financial Intelligence Unit — government body that receives suspicious-transaction reports.",
  "kz-fiu": "Kazakhstan Financial Intelligence Unit data source.",

  // Network / forensic
  tor: "Anonymity network that routes traffic through volunteer relays to hide origin.",
  "dark web": "Sites only reachable through anonymity networks like Tor.",
  ip: "Internet Protocol address — numeric identifier of a device on a network.",
  geolocation: "Approximate physical location derived from an IP, GPS, or metadata.",
  exif: "Metadata embedded in a photo — camera, time, often GPS coordinates.",
  hash: "Fixed-length fingerprint of a file or message — same input always produces the same hash.",
  icmp: "Low-level network protocol used by ping and traceroute.",
  telegram: "Messaging app — often monitored for closed-channel coordination.",

  // App-specific
  "live feed": "Real-time stream of new findings from active crawlers.",
  "live ticker": "Real-time stream of new findings from active crawlers.",
  graph: "Network view showing entities and the relationships between them.",
  timeline: "Chronological view of events for an entity or case.",
  "ai findings": "Hypotheses and links surfaced automatically by the analysis models.",
};

const KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const ESCAPED = KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
// Word boundaries; supports multi-word matches with hyphens/spaces inside.
const PATTERN = new RegExp(`(?<![\\w-])(${ESCAPED.join("|")})(?![\\w-])`, "gi");

function defOf(s: string): string | undefined {
  return GLOSSARY[s.toLowerCase()];
}

/** Inline term with a dotted underline + hover tooltip. */
export function Term({
  children,
  def,
  className,
}: {
  children: React.ReactNode;
  def?: string;
  className?: string;
}) {
  const label = typeof children === "string" ? children : "";
  const definition = def ?? defOf(label);
  if (!definition) return <>{children}</>;
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 hover:decoration-primary",
            className,
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[280px] border border-border bg-popover text-[12px] leading-snug text-popover-foreground"
      >
        <div className="mono mb-0.5 text-[10px] uppercase tracking-[0.16em] text-primary">{label || "term"}</div>
        <div>{definition}</div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Auto-wrap glossary terms inside a plain string. Use anywhere user-facing
 * copy might contain jargon. Pass a string child only.
 *
 *   <Glossed>Mixer-adjacent transfer detected on Tor exit.</Glossed>
 */
export function Glossed({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  if (typeof children !== "string" || !children) {
    return <span className={className}>{children}</span>;
  }
  const parts: React.ReactNode[] = [];
  const re = new RegExp(PATTERN.source, PATTERN.flags);
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(children)) !== null) {
    if (m.index > last) parts.push(children.slice(last, m.index));
    parts.push(
      <Term key={`g-${i++}-${m.index}`}>{m[0]}</Term>,
    );
    last = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex++; // safety against zero-width
  }
  if (last < children.length) parts.push(children.slice(last));
  return <span className={className}>{parts}</span>;
}