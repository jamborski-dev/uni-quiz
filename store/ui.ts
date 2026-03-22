import { create } from "zustand"

interface UIStore {
  navigatingTo: string | null
  startNavigation: (key: string) => void
  endNavigation: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  navigatingTo: null,
  startNavigation: (key) => set({ navigatingTo: key }),
  endNavigation: () => set({ navigatingTo: null }),
}))
