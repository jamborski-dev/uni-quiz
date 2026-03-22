import { create } from "zustand"
import type { AppNotification } from "@/lib/types"

interface NotificationsStore {
  items: AppNotification[]
  isOpen: boolean
  setItems: (items: AppNotification[]) => void
  addItem: (item: AppNotification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  toggleOpen: () => void
  setOpen: (v: boolean) => void
  unreadCount: () => number
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  items: [],
  isOpen: false,

  setItems: (items) => set({ items }),

  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),

  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    })),

  markAllRead: () =>
    set((s) => ({
      items: s.items.map((n) => ({ ...n, is_read: true })),
    })),

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (v) => set({ isOpen: v }),

  unreadCount: () => get().items.filter((n) => !n.is_read).length,
}))
