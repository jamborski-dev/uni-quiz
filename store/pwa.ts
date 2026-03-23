import { create } from "zustand"

// BeforeInstallPromptEvent is not in standard lib typings
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  prompt(): Promise<void>
}

interface PWAStore {
  canInstall: boolean
  deferredPrompt: BeforeInstallPromptEvent | null
  hasUpdate: boolean
  isInstalled: boolean
  registration: ServiceWorkerRegistration | null

  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void
  setHasUpdate: (v: boolean) => void
  setIsInstalled: (v: boolean) => void
  setRegistration: (r: ServiceWorkerRegistration | null) => void
  install: () => Promise<"accepted" | "dismissed" | null>
  applyUpdate: () => void
}

export const usePWAStore = create<PWAStore>((set, get) => ({
  canInstall: false,
  deferredPrompt: null,
  hasUpdate: false,
  isInstalled: false,
  registration: null,

  setDeferredPrompt: (e) => set({ deferredPrompt: e, canInstall: e !== null }),
  setHasUpdate: (v) => set({ hasUpdate: v }),
  setIsInstalled: (v) => set({ isInstalled: v }),
  setRegistration: (r) => set({ registration: r }),

  install: async () => {
    const { deferredPrompt } = get()
    if (!deferredPrompt) return null
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    set({ deferredPrompt: null, canInstall: false })
    return outcome
  },

  applyUpdate: () => {
    const { registration } = get()
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
    }
  },
}))
