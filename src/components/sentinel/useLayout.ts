import { useEffect, useState } from "react";

export type LayoutMode = "mobile" | "tablet" | "desktop" | "xl";

function compute(width: number): LayoutMode {
  if (width >= 1280) return "xl";
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

export function useLayout(): LayoutMode {
  // SSR-safe: assume xl on the server, then snap to real mode after hydration.
  const [mode, setMode] = useState<LayoutMode>("xl");

  useEffect(() => {
    const apply = () => setMode(compute(window.innerWidth));
    apply();
    requestAnimationFrame(apply);
    const mqs = [
      window.matchMedia("(min-width: 1280px)"),
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(min-width: 768px)"),
    ];
    mqs.forEach((mq) => mq.addEventListener("change", apply));
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      mqs.forEach((mq) => mq.removeEventListener("change", apply));
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return mode;
}

export function usePersistentBool(key: string, initial: boolean) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored != null) setV(stored === "1");
    } catch {}
  }, [key]);
  const set = (next: boolean) => {
    setV(next);
    try { window.localStorage.setItem(key, next ? "1" : "0"); } catch {}
  };
  return [v, set] as const;
}