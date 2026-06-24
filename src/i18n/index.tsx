import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DICT, LANGS, type Lang } from "./dict";

const STORAGE_KEY = "shadowless.lang";
const DEFAULT_LANG: Lang = "ru";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

function readInitial(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (v && (DICT as Record<string, unknown>)[v]) return v;
  } catch {}
  return DEFAULT_LANG;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => { setLangState(readInitial()); }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const table = DICT[lang] ?? DICT[DEFAULT_LANG];
    let s = table[key] ?? DICT[DEFAULT_LANG][key] ?? DICT.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const v = useContext(Ctx);
  if (!v) {
    // Fallback so components used outside provider still render (e.g. error boundary).
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: (k) => DICT[DEFAULT_LANG][k] ?? k,
    };
  }
  return v;
}

export function useT() { return useI18n().t; }

export { LANGS };
export type { Lang };