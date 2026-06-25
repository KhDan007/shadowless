import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface NotificationItem {
  id: string;
  ts: number;
  level: "info" | "warn" | "crit" | "ok";
  title: string;
  desc?: string;
  investigation_id?: string | null;
  read: boolean;
}

interface NotificationsStore {
  items: NotificationItem[];
  seen: Record<string, true>; // dedupe keys
  push(key: string, item: Omit<NotificationItem, "id" | "read">): void;
  markAllRead(): void;
  clear(): void;
}

const MAX = 100;

export const useNotifications = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      items: [],
      seen: {},
      push: (key, item) => {
        if (get().seen[key]) return;
        const id = `${item.ts}-${Math.random().toString(36).slice(2, 7)}`;
        const entry: NotificationItem = { ...item, id, read: false };
        set((s) => {
          const next = [entry, ...s.items];
          if (next.length > MAX) next.length = MAX;
          return { items: next, seen: { ...s.seen, [key]: true } };
        });
      },
      markAllRead: () =>
        set((s) => ({ items: s.items.map((it) => ({ ...it, read: true })) })),
      clear: () => set({ items: [], seen: {} }),
    }),
    {
      name: "shadowless.notifications.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, seen: s.seen }),
    },
  ),
);