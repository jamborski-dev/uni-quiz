"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"

interface TooltipProps {
  /** Text or node shown in the popover */
  content: React.ReactNode
  children: React.ReactNode
  /**
   * When true the wrapper captures pointer events even when the child
   * button is `disabled` (disabled buttons swallow all pointer events).
   */
  wrapDisabled?: boolean
  side?: "top" | "bottom"
  maxWidth?: string
}

/**
 * Hover tooltip on desktop, tap-to-toggle popover on mobile.
 * Use `wrapDisabled` so disabled buttons still reveal their explanation.
 */
export default function Tooltip({
  content,
  children,
  wrapDisabled = false,
  side = "top",
  maxWidth = "max-w-[220px]",
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setVisible(true)
  }, [])

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 80)
  }, [])

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setVisible((v) => !v)
  }, [])

  // Close when clicking/tapping outside
  useEffect(() => {
    if (!visible) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }
    document.addEventListener("mousedown", onOutside)
    document.addEventListener("touchstart", onOutside)
    return () => {
      document.removeEventListener("mousedown", onOutside)
      document.removeEventListener("touchstart", onOutside)
    }
  }, [visible])

  const yShift = side === "top" ? 4 : -4

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={toggle}
      // Let natural clicks pass through to children when not wrapping disabled
      style={wrapDisabled ? { cursor: "default" } : undefined}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, scale: 0.94, y: yShift }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: yShift }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            className={`absolute z-[60] left-1/2 -translate-x-1/2 pointer-events-none
              ${side === "top" ? "bottom-full mb-2.5" : "top-full mt-2.5"}
              ${maxWidth} w-max`}
          >
            <div className="relative bg-zinc-900 dark:bg-zinc-700 text-white text-[11px] leading-snug font-medium px-2.5 py-1.5 rounded-lg shadow-xl text-center">
              {content}
              <span
                className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-700 rotate-45
                  ${side === "top" ? "-bottom-[4px]" : "-top-[4px]"}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
