import { Languages, Check } from "lucide-react";
import { useI18n, LANGS, type Lang } from "@/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Variant = "chip" | "icon" | "row";

export function LanguageSwitcher({
  variant = "chip",
  className,
}: { variant?: Variant; className?: string }) {
  const { lang, setLang, t } = useI18n();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const trigger =
    variant === "icon" ? (
      <button
        aria-label={t("common.language")}
        title={t("common.language")}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary",
          className,
        )}
      >
        <Languages size={14} />
      </button>
    ) : variant === "row" ? (
      <button
        aria-label={t("common.language")}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] text-foreground/80 hover:bg-secondary hover:text-foreground",
          className,
        )}
      >
        <Languages size={14} />
        <span className="font-medium">{t("common.language")}</span>
        <span className="mono ml-auto text-[11px] uppercase tracking-wider text-muted-foreground">
          {current.code}
        </span>
      </button>
    ) : (
      <button
        aria-label={t("common.language")}
        title={t("common.language")}
        className={cn(
          "mono inline-flex h-9 items-center gap-1.5 rounded border border-foreground/15 bg-black/40 px-2.5 text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition hover:border-[color:var(--accent-signal)]/45 hover:text-[color:var(--accent-signal)]",
          className,
        )}
      >
        <Languages size={12} />
        {current.code.toUpperCase()}
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border-border bg-secondary text-foreground/80">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code as Lang)}
            className="flex items-center gap-2 text-[13px]"
          >
            <span className="mono w-6 text-[11px] uppercase tracking-wider text-muted-foreground">{l.code}</span>
            <span className="flex-1">{l.native}</span>
            {l.code === lang && <Check size={12} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}