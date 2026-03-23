"use client"

import { useEffect, useRef } from "react"
import { usePWAStore, type BeforeInstallPromptEvent } from "@/store/pwa"
import { useToastStore } from "@/store/toast"
import { useNotificationsStore } from "@/store/notifications"

export function usePWA() {
  const { setDeferredPrompt, setIsInstalled, setHasUpdate, setRegistration } = usePWAStore()
  const { addToast } = useToastStore()
  const { addItem } = useNotificationsStore()
  const updateNotifiedRef = useRef(false)
  const installNotifiedRef = useRef(false)

  useEffect(() => {
    // Detect if already running as installed PWA
    const mq = window.matchMedia("(display-mode: standalone)")
    setIsInstalled(mq.matches || !!(window.navigator as { standalone?: boolean }).standalone)
    const handleMQ = (e: MediaQueryListEvent) => setIsInstalled(e.matches)
    mq.addEventListener("change", handleMQ)

    // Install prompt — Chrome / Edge / Android
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      if (!installNotifiedRef.current) {
        installNotifiedRef.current = true
        addToast({
          type: "info",
          title: "Install the app",
          message: "Add to your home screen for the best experience",
          timeout: 8000,
        })
        addItem({
          id: `pwa-install-${Date.now()}`,
          user_id: "",
          type: "info",
          title: "Install the app",
          message: "Add Open Uni Quiz to your home screen for a faster, offline-ready experience.",
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }
    }
    window.addEventListener("beforeinstallprompt", handleInstallPrompt)

    // Installed confirmation
    const handleInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      addToast({ type: "success", title: "App installed!", timeout: 4000 })
    }
    window.addEventListener("appinstalled", handleInstalled)

    // Service worker update detection
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        const notifyUpdate = () => {
          if (updateNotifiedRef.current) return
          updateNotifiedRef.current = true
          setHasUpdate(true)
          addToast({
            type: "info",
            title: "Update available",
            message: "A new version is ready — tap Update in Settings",
            timeout: 0,
          })
          addItem({
            id: `pwa-update-${Date.now()}`,
            user_id: "",
            type: "info",
            title: "App update available",
            message: "A new version of Open Uni Quiz is ready. Go to Settings → App to apply it.",
            is_read: false,
            created_at: new Date().toISOString(),
          })
        }

        // Already waiting (e.g. page reopened after SW updated in background)
        if (reg.waiting) notifyUpdate()

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setRegistration(reg)
              notifyUpdate()
            }
          })
        })
      })

      // When a new SW takes control, reload to apply changes
      let refreshing = false
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }

    return () => {
      mq.removeEventListener("change", handleMQ)
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
