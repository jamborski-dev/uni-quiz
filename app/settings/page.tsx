"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  HiCog6Tooth, HiCheckCircle, HiDevicePhoneMobile,
  HiArrowDownTray, HiArrowPath, HiSignal,
} from "react-icons/hi2"
import { useAuthContext } from "@/context/AuthContext"
import { useToastStore } from "@/store/toast"
import { usePWAStore } from "@/store/pwa"
import PageTransition from "@/components/PageTransition"
import type { StrictnessLevel, QuestionMode } from "@/lib/types"

const STRICTNESS_OPTIONS: { value: StrictnessLevel; label: string; description: string }[] = [
  { value: "lenient",  label: "Lenient",  description: "Minor errors still count as correct" },
  { value: "balanced", label: "Balanced", description: "Standard marking — reasonable latitude" },
  { value: "strict",   label: "Strict",   description: "Full accuracy required for open answers" },
]

const MODE_OPTIONS: { value: QuestionMode; label: string; description: string }[] = [
  {
    value: "mixed",
    label: "Mixed",
    description: "Random questions from the full question pool",
  },
  {
    value: "new_only",
    label: "New only",
    description: "Only questions you have not yet answered",
  },
  {
    value: "weak_first",
    label: "Weak topics first",
    description: "Prioritise questions on topics where your score is lowest",
  },
  {
    value: "spaced_repetition",
    label: "Spaced repetition",
    description: "Surface questions you haven't seen recently, weighted by weakness",
  },
  {
    value: "mastery",
    label: "Mastery mode",
    description: "Re-show incorrectly answered questions until you consistently get them right",
  },
]

function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false)
  useEffect(() => {
    const ua = navigator.userAgent
    setIsIOS(/iPhone|iPad|iPod/.test(ua) && !(window.navigator as { standalone?: boolean }).standalone)
  }, [])
  return isIOS
}

export default function SettingsPage() {
  const { userId, profile, refreshProfile } = useAuthContext()
  const { addToast } = useToastStore()
  const { canInstall, isInstalled, hasUpdate, install, applyUpdate } = usePWAStore()
  const isIOS = useIsIOS()

  const [installing, setInstalling] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [strictness, setStrictness] = useState<StrictnessLevel>("balanced")
  const [mode, setMode] = useState<QuestionMode>("mixed")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setStrictness(profile.quiz_strictness)
      setMode(profile.question_mode ?? "mixed")
    }
  }, [profile])

  const isDirty =
    strictness !== profile?.quiz_strictness ||
    mode !== (profile?.question_mode ?? "mixed")

  async function handleSave() {
    if (!userId || !isDirty) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, quiz_strictness: strictness, question_mode: mode }),
      })
      if (!res.ok) throw new Error()
      await refreshProfile()
      addToast({ type: "success", title: "Settings saved", timeout: 3000 })
    } catch {
      addToast({ type: "error", title: "Failed to save settings", message: "Please try again", timeout: 0 })
    } finally {
      setSaving(false)
    }
  }

  async function handleInstall() {
    setInstalling(true)
    try {
      const outcome = await install()
      if (outcome === "accepted") {
        addToast({ type: "success", title: "App installed!", timeout: 4000 })
      }
    } finally {
      setInstalling(false)
    }
  }

  function handleUpdate() {
    setUpdating(true)
    applyUpdate()
    // reload is triggered by the controllerchange event in usePWA
    setTimeout(() => setUpdating(false), 5000)
  }

  return (
    <PageTransition>
      <main className="min-h-screen px-4 pt-6 pb-10 max-w-sm mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <HiCog6Tooth className="text-indigo-500 dark:text-indigo-400 text-xl" />
            <h1 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight">Settings</h1>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Personalise your quiz experience</p>
        </motion.div>

        <div className="flex flex-col gap-5">
          {/* Question delivery mode */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white dark:bg-[#1a1828] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-0.5">Question delivery</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">How questions are selected when you start a quiz</p>
            <div className="flex flex-col gap-2">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-colors ${
                    mode === opt.value
                      ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{opt.label}</span>
                    {mode === opt.value && (
                      <HiCheckCircle className="text-indigo-500 dark:text-indigo-400 text-base shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </motion.section>

          {/* AI marking strictness */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-[#1a1828] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-0.5">AI marking strictness</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">How strictly open-answer responses are evaluated</p>
            <div className="flex flex-col gap-2">
              {STRICTNESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStrictness(opt.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-colors ${
                    strictness === opt.value
                      ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{opt.label}</span>
                    {strictness === opt.value && (
                      <HiCheckCircle className="text-indigo-500 dark:text-indigo-400 text-base shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </motion.section>

          {/* App (PWA) */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white dark:bg-[#1a1828] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <HiDevicePhoneMobile className="text-indigo-500 dark:text-indigo-400 text-base shrink-0" />
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">App</h2>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
              Install on your device for offline access and a native feel
            </p>

            <div className="flex flex-col gap-3">
              {/* Install status row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiSignal className="text-zinc-400 dark:text-zinc-500 text-sm" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-300">Status</span>
                </div>
                {isInstalled ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <HiCheckCircle className="text-sm" /> Installed
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Running in browser</span>
                )}
              </div>

              {/* Install button — Chrome/Edge/Android */}
              {!isInstalled && canInstall && (
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 transition-opacity active:scale-[0.98]"
                >
                  <HiArrowDownTray className="text-sm" />
                  {installing ? "Installing…" : "Add to home screen"}
                </button>
              )}

              {/* iOS Safari manual instructions */}
              {!isInstalled && !canInstall && isIOS && (
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 p-3">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                    Install on iOS
                  </p>
                  <ol className="text-[11px] text-indigo-600 dark:text-indigo-400 space-y-0.5 list-decimal list-inside">
                    <li>Tap the <strong>Share</strong> button in Safari</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                    <li>Tap <strong>Add</strong> to confirm</li>
                  </ol>
                </div>
              )}

              {/* Update available */}
              {hasUpdate && (
                <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Update available</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">A new version is ready to install</p>
                  </div>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold disabled:opacity-50 transition-opacity active:scale-[0.97]"
                  >
                    <HiArrowPath className={`text-sm ${updating ? "animate-spin" : ""}`} />
                    {updating ? "Updating…" : "Update now"}
                  </button>
                </div>
              )}
            </div>
          </motion.section>

          {/* Save button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <button
              onClick={handleSave}
              disabled={!isDirty || saving || !userId}
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 transition-opacity active:scale-[0.98]"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </motion.div>
        </div>
      </main>
    </PageTransition>
  )
}
