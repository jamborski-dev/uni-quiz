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
  /** Force-checks for a new SW. Resolves true if an update was found. */
  checkForUpdate: () => Promise<boolean>
  /** Unregisters all SWs, wipes every cache bucket, then reloads. */
  clearCacheAndReload: () => Promise<void>
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

  checkForUpdate: async () => {
    const { registration } = get()
    if (!registration) return false
    try {
      await registration.update()
      // Give the browser a moment to detect the waiting worker
      await new Promise((r) => setTimeout(r, 500))
      return !!registration.waiting
    } catch {
      return false
    }
  },

  clearCacheAndReload: async () => {
    // Unregister every SW scope
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((r) => r.unregister()))
    }
    // Wipe every cache bucket (workbox creates several)
    if ("caches" in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    window.location.reload()
  },
}))
