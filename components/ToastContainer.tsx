"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import {
  HiCheckCircle,
  HiXCircle,
  HiInformationCircle,
  HiExclamationTriangle,
  HiXMark,
} from "react-icons/hi2"
import { useToastStore, type ToastType } from "@/store/toast"

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <HiCheckCircle className="text-emerald-500 dark:text-emerald-400 text-lg shrink-0" />,
  error:   <HiXCircle className="text-red-500 dark:text-red-400 text-lg shrink-0" />,
  info:    <HiInformationCircle className="text-indigo-500 dark:text-indigo-400 text-lg shrink-0" />,
  warning: <HiExclamationTriangle className="text-amber-500 dark:text-amber-400 text-lg shrink-0" />,
}

const BORDER: Record<ToastType, string> = {
  success: "border-l-emerald-500",
  error:   "border-l-red-500",
  info:    "border-l-indigo-500",
  warning: "border-l-amber-500",
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`pointer-events-auto w-full max-w-sm bg-white dark:bg-[#1a1828] border border-zinc-200 dark:border-zinc-700 border-l-4 ${BORDER[toast.type]} rounded-2xl shadow-lg px-4 py-3 flex items-start gap-3`}
          >
            {ICONS[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-snug">
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Dismiss"
            >
              <HiXMark className="text-base" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
