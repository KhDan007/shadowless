import { useState } from "react";
import {
  LayoutGrid, Share2, Users, FileSearch, Brain, FileText, Settings,
  ShieldCheck, Cpu, Lock, ChevronRight, History, Sun, Moon, Command, ShieldAlert,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { CASES } from "./data";
import { RiskBadge } from "./atoms";
import { useSentinelData } from "./store";
import { BureauLogo } from "./BureauLogo";
import { useTheme } from "./useTheme";
import { useI18n } from "@/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const NAV = [
  { to: "/overview",  icon: LayoutGrid, key: "nav.overview" },
  { to: "/workspace", icon: Share2,     key: "nav.graph" },
  { to: "/entities",  icon: Users,      key: "nav.entities" },
  { to: "/evidence",  icon: FileSearch, key: "nav.evidence" },
  { to: "/timeline",  icon: History,    key: "nav.timeline" },
  { to: "/ai",        icon: Brain,      key: "nav.ai" },
  { to: "/reports",   icon: FileText,   key: "nav.reports" },
  { to: "/captcha",   icon: ShieldAlert, key: "nav.captcha" },
  { to: "/settings",  icon: Settings,   key: "nav.settings" },
] as const;

export function Sidebar({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const [activeCase, setActiveCase] = useState("KZ-2048");
  const selectedCase = CASES.find((c) => c.id === activeCase) ?? CASES[0];
  const liveInvestigation = useSentinelData((s) => s.investigation);
  const { theme, toggle: toggleTheme } = useTheme();
  const { t } = useI18n();
  const openCommand = () => window.dispatchEvent(new CustomEvent("sentinel:open-command"));

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <aside className="flex h-full w-14 shrink-0 flex-col items-center border-r border-border bg-card py-3">
          <div className="relative flex h-9 w-9 items-center justify-center text-primary">
            <BureauLogo size={28} />
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-card" />
          </div>
          <nav className="mt-4 flex flex-col items-center gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      onClick={() => onNavigate?.()}
                      className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-sm transition-colors",
                        active ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary " />}
                      <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-[12px]">{t(item.key)}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col items-center gap-2 pt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex"><LanguageSwitcher variant="icon" className="h-7 w-7" /></span>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[12px]">{t("common.language")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border-border text-foreground/80 hover:border-primary hover:text-primary"
                  aria-label={t("side.toggle_theme")}
                >
                  {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[12px]">{t("side.toggle_theme")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[12px]">{t("side.status.ready")} · {t("side.status.ai")} · TLS 1.3</TooltipContent>
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>
    );
  }

  return (
    <aside className="flex h-full w-full min-w-[200px] shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <div className="relative flex h-8 w-8 items-center justify-center text-primary">
          <BureauLogo size={28} />
          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-card" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-bold tracking-wide text-foreground">SHADOWLESS</span>
          <span className="mono text-[10px] tracking-[0.15em] text-muted-foreground">{t("brand.tagline")}</span>
        </div>
        <div className="ml-auto"><LanguageSwitcher variant="icon" className="h-7 w-7" /></div>
      </div>

      {/* Nav */}
      <nav className="px-2 py-3">
        <div className="px-2 pb-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground">{t("side.workspace")}</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => onNavigate?.()}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-[14px] transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary " />}
              <Icon size={16} strokeWidth={active ? 2.25 : 1.75} />
              <span className="font-medium">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Active case (expanded) */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <div className="flex items-center justify-between px-2 pb-1.5 pt-3">
          <span className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground">{t("side.activecase")}</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="mono inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline">
                {t("side.viewall")} {CASES.length} <ChevronRight size={10} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-72 border-border bg-secondary p-1.5">
              <div className="px-2 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t("side.allcases")}</div>
              <div className="space-y-0.5">
                {CASES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCase(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left",
                      c.id === activeCase ? "bg-primary/15" : "hover:bg-secondary",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="mono text-[12px] font-semibold text-foreground">#{c.id}</div>
                      <div className="truncate text-[12px] text-foreground/80">{c.title}</div>
                    </div>
                    <RiskBadge risk={c.risk} />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="rounded-sm border border-primary/40 bg-primary/15 p-2.5">
          {liveInvestigation ? (
            <>
              <div className="flex items-center justify-between">
                <span className="mono text-[12px] font-semibold text-foreground">#{liveInvestigation.id.slice(0, 8).toUpperCase()}</span>
                <span className="mono rounded-sm border border-primary/50 bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {liveInvestigation.status}
                </span>
              </div>
              <div className="mt-1 truncate text-[13px] text-foreground" title={liveInvestigation.title}>{liveInvestigation.title}</div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="mono text-[12px] font-semibold text-foreground">#{selectedCase.id}</span>
                <RiskBadge risk={selectedCase.risk} />
              </div>
              <div className="mt-1 truncate text-[13px] text-foreground">{selectedCase.title}</div>
            </>
          )}
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <CaseStat label={t("side.case.entities")} value={String(selectedCase.entities)} />
            <CaseStat label={t("side.case.findings")} value="14" />
            <CaseStat label={t("side.case.alerts")} value="3" />
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          {CASES.filter((c) => c.id !== activeCase).slice(0, 3).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCase(c.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12.5px] text-foreground/80 hover:bg-secondary hover:text-foreground"
            >
              <span className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                c.risk === "critical" && "bg-destructive",
                c.risk === "high" && "bg-[color:var(--risk-high)]",
                c.risk === "medium" && "bg-[color:var(--risk-medium)]",
                c.risk === "low" && "bg-primary",
              )} />
              <span className="mono text-[11.5px] text-muted-foreground">#{c.id}</span>
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compressed status footer */}
      <TooltipProvider delayDuration={120}>
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <StatusDot icon={<ShieldCheck size={10} />} label={t("side.status.ready")} />
            <StatusDot icon={<Cpu size={10} />} label={t("side.status.ai")} />
            <StatusDot icon={<Lock size={10} />} label={t("side.status.secure")} />
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={openCommand}
                  className="inline-flex h-6 items-center gap-1 rounded-sm border border-border bg-background px-1.5 text-[10.5px] text-muted-foreground hover:border-primary hover:text-primary"
                  aria-label={t("top.command")}
                >
                  <Command size={10} /> K
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[12px]">{t("side.command")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  aria-label={t("side.toggle_theme")}
                >
                  {theme === "dark" ? <Sun size={10} /> : <Moon size={10} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[12px]">{t("side.theme")} · {theme === "dark" ? t("side.toggle_theme") : t("side.toggle_theme")}</TooltipContent>
            </Tooltip>
            <span className="mono pl-1 text-[10.5px] text-muted-foreground">v2.4</span>
          </div>
        </div>
      </TooltipProvider>
    </aside>
  );
}

function CaseStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-sm border border-border bg-background px-1 py-1" title={hint}>
      <div className="mono text-[13px] font-semibold text-foreground">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusDot({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-primary">
          <span className="relative flex h-1.5 w-1.5 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary" />
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
          </span>
          <span className="opacity-60">{icon}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[12px]">{label}</TooltipContent>
    </Tooltip>
  );
}