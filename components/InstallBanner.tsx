"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HiXMark, HiArrowDownTray, HiArrowUpTray, HiEllipsisVertical } from "react-icons/hi2"
import { usePWAStore } from "@/store/pwa"
import { usePlatform } from "@/hooks/usePlatform"

const DISMISSED_KEY = "pwa-install-banner-dismissed"

export default function InstallBanner() {
  const { canInstall, isInstalled, install } = usePWAStore()
  const platform = usePlatform()
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Don't show if already installed or user previously dismissed
    if (isInstalled) return
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    // Show for Chrome (has native prompt) or manual-install platforms
    const shouldShow = canInstall || platform === "ios" || platform === "firefox"
    if (shouldShow) {
      // Slight delay so it doesn't flash in before the page settles
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [canInstall, isInstalled, platform])

  // Hide once installed
  useEffect(() => {
    if (isInstalled) setVisible(false)
  }, [isInstalled])

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1")
    setVisible(false)
  }

  async function handleInstall() {
    setInstalling(true)
    try {
      await install()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="install-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 z-40 px-3 pointer-events-none"
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
        >
          <div className="pointer-events-auto max-w-sm mx-auto bg-white dark:bg-[#1a1828] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {/* Gradient accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* App icon */}
                <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-2xl shadow-sm">
                  🎓
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                    Install Open Uni Quiz
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                    Add to your home screen for offline access and a faster experience
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={dismiss}
                  className="shrink-0 p-1 -mt-1 -mr-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <HiXMark className="text-lg" />
                </button>
              </div>

              {/* Action area */}
              <div className="mt-3">
                {/* Chrome / Edge / Samsung — native prompt */}
                {canInstall && (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50 active:scale-[0.98]"
                  >
                    <HiArrowDownTray className="text-sm" />
                    {installing ? "Installing…" : "Add to home screen"}
                  </button>
                )}

                {/* iOS Safari */}
                {!canInstall && platform === "ios" && (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Tap</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
                      <HiArrowUpTray className="text-xs" /> Share
                    </span>
                    <span>then</span>
                    <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
                      Add to Home Screen
                    </span>
                  </div>
                )}

                {/* Firefox */}
                {!canInstall && platform === "firefox" && (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Tap</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
                      <HiEllipsisVertical className="text-xs" /> Menu
                    </span>
                    <span>then</span>
                    <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
                      Install
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
