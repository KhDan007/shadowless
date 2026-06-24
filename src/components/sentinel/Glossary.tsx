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
  osint: "OSINT — разведка по открытым источникам: данные из веба, соцсетей, утечек.",
  dossier: "Досье — собранный материал по одному объекту: личность, связи, улики, риск.",
  entity: "Объект расследования: человек, кошелёк, аккаунт, IP, устройство.",
  edge: "Связь между двумя объектами на графе (перевод, сообщение, со-локация и т. д.).",
  node: "Узел — объект, изображённый кругом на графе.",
  vetted: "Связь подтверждена аналитиком — уверенность ≥ 90%, считается надёжной.",
  confidence: "Уверенность системы в том, что связь или находка реальна (0–100%).",
  "risk score": "Сводная оценка риска 0–100, учитывающая поведение, связи и сигналы.",
  "chain of custody": "Цепочка хранения — аудит, доказывающий, что улика не подделана от сбора до суда.",
  redact: "Скрыть или замаскировать чувствительные поля перед публикацией улик.",
  takedown: "Формальный запрос на удаление противоправного контента с площадки.",
  acked: "Подтверждено — аналитик увидел тревогу и взял её в работу.",
  alert: "Тревога — оповещение, требующее внимания аналитика.",
  crawler: "Краулер — автоматический сборщик постов, транзакций или фидов из источника.",
  "command palette": "Командная панель (⌘K) — клавиатурный поиск объектов, улик и действий.",
  "досье": "Досье — собранный материал по одному объекту: личность, связи, улики, риск.",
  "объект": "Объект расследования: человек, кошелёк, аккаунт, IP, устройство.",
  "узел": "Узел — объект, изображённый кругом на графе.",
  "связь": "Связь между двумя объектами на графе.",
  "уверенность": "Уверенность системы в том, что связь или находка реальна (0–100%).",
  "оценка риска": "Сводная оценка риска 0–100, учитывающая поведение, связи и сигналы.",
  "цепочка хранения": "Аудит, доказывающий, что улика не подделана от сбора до суда.",
  "тревога": "Оповещение, требующее внимания аналитика.",
  "краулер": "Автоматический сборщик постов, транзакций или фидов из источника.",

  // Crypto / finance
  btc: "Bitcoin — псевдо-анонимная криптовалюта, отслеживается по адресам в блокчейне.",
  wallet: "Кошелёк — адрес или набор адресов, контролируемый одним актором.",
  mixer: "Миксер — сервис, перемешивающий крипту, чтобы разорвать связь отправитель ↔ получатель.",
  "mixer-adjacent": "Транзакция на расстоянии одного перехода от известного миксера — сильный сигнал отмывания.",
  exchange: "Биржа — площадка обмена крипты на фиат, обычно с KYC.",
  kyc: "KYC — верификация личности на регулируемых площадках.",
  fiu: "ФРМ — служба финансового мониторинга, принимающая сообщения о подозрительных операциях.",
  "kz-fiu": "ФРМ Республики Казахстан — источник данных финансовой разведки.",
  "кошелёк": "Адрес или набор адресов, контролируемый одним актором в блокчейне.",
  "миксер": "Сервис, перемешивающий крипту, чтобы разорвать связь отправитель ↔ получатель.",

  // Network / forensic
  tor: "Tor — анонимная сеть, скрывающая источник трафика через волонтёрские релеи.",
  "dark web": "Даркнет — сайты, доступные только через анонимные сети вроде Tor.",
  ip: "IP-адрес — числовой идентификатор устройства в сети.",
  geolocation: "Приблизительное физическое местоположение по IP, GPS или метаданным.",
  exif: "EXIF — метаданные в фотографии: камера, время, часто GPS-координаты.",
  hash: "Хеш — фиксированный отпечаток файла или сообщения; один вход даёт тот же хеш.",
  icmp: "ICMP — низкоуровневый протокол, используется ping и traceroute.",
  telegram: "Telegram — мессенджер, часто мониторится из-за закрытой координации каналов.",
  "даркнет": "Сайты, доступные только через анонимные сети вроде Tor.",
  "хеш": "Фиксированный отпечаток файла или сообщения; один вход даёт тот же хеш.",

  // App-specific
  "live feed": "Лента в реальном времени — поток новых находок от активных краулеров.",
  "live ticker": "Лента в реальном времени — поток новых находок от активных краулеров.",
  graph: "Граф — сетевая визуализация объектов и связей между ними.",
  timeline: "Хронология — события по объекту или делу в хронологическом порядке.",
  "ai findings": "AI-находки — гипотезы и связи, выявленные моделями автоматически.",
  "граф": "Сетевая визуализация объектов и связей между ними.",
  "хронология": "События по объекту или делу в хронологическом порядке.",
  "ai-находки": "Гипотезы и связи, выявленные моделями автоматически.",
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