"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { HiXMark, HiArrowRight, HiArrowLeft } from "react-icons/hi2"
import { useOnboardingStore, ONBOARDING_STEPS } from "@/store/onboarding"
import { useAuthContext } from "@/context/AuthContext"

const PAD = 10
const TOOLTIP_H = 185  // conservative card height estimate
const MARGIN = 12

interface SpotRect { x: number; y: number; w: number; h: number }
interface TooltipPos { top: number; left: number; width: number }

export default function OnboardingOverlay() {
  const { isActive, step, start, next, prev, skip } = useOnboardingStore()
  const { userId, loading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)
  const [spot, setSpot] = useState<SpotRect>({ x: 0, y: 0, w: 0, h: 0 })
  const [tooltip, setTooltip] = useState<TooltipPos>({ top: 0, left: 16, width: 300 })
  const [mounted, setMounted] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const prevStep = useRef(-1)

  const currentStep = ONBOARDING_STEPS[step]
  const isLastStep = step === ONBOARDING_STEPS.length - 1

  // ── Auto-start on first authenticated visit ──────────────────────────────
  useEffect(() => {
    if (!loading && userId) start()
  }, [loading, userId, start])

  // ── Viewport tracking ────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)
    setVw(window.innerWidth)
    setVh(window.innerHeight)
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ── Navigate to required path when step demands it ───────────────────────
  useEffect(() => {
    if (!isActive) return
    const required = currentStep?.requiresPath
    if (required && pathname !== required) {
      setNavigating(true)
      router.push(required)
    }
  }, [isActive, step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear navigating once the route lands
  useEffect(() => {
    if (!navigating) return
    const required = currentStep?.requiresPath
    if (!required || pathname === required) setNavigating(false)
  }, [pathname, navigating, currentStep])

  // ── Pure position calculator (no side-effects beyond setState) ───────────
  const computeSpot = useCallback(() => {
    const ww = window.innerWidth
    const wh = window.innerHeight
    const sel = currentStep?.selector

    if (!sel) {
      // Welcome step: invisible 2x2 dot at centre = full dark overlay
      setSpot({ x: ww / 2 - 1, y: wh / 2 - 1, w: 2, h: 2 })
      const tw = Math.min(320, ww - 32)
      setTooltip({
        top: Math.max(8, wh / 2 - TOOLTIP_H / 2),
        left: Math.max(16, ww / 2 - tw / 2),
        width: tw,
      })
      return
    }

    const el = document.querySelector(sel)
    if (!el) return

    const r = el.getBoundingClientRect()
    const sx = r.left - PAD
    const sy = r.top - PAD
    const sw = r.width + PAD * 2
    const sh = r.height + PAD * 2
    setSpot({ x: sx, y: sy, w: sw, h: sh })

    // Tooltip placement
    const tw = Math.min(320, ww - 32)
    const cx = sx + sw / 2
    const left = Math.max(16, Math.min(ww - tw - 16, cx - tw / 2))

    const spaceAbove = sy - MARGIN
    const spaceBelow = wh - (sy + sh) - MARGIN

    const placeAbove = currentStep.position === "above"
      ? spaceAbove >= 80
      : currentStep.position === "below"
      ? false
      : spaceAbove >= spaceBelow && spaceAbove >= 80

    const rawTop = placeAbove
      ? sy - MARGIN - TOOLTIP_H
      : sy + sh + MARGIN

    setTooltip({ top: Math.max(8, Math.min(wh - TOOLTIP_H - 8, rawTop)), left, width: tw })
  }, [currentStep])

  // ── Step change: scroll element into view, then compute ──────────────────
  useEffect(() => {
    if (!isActive || !mounted || navigating) return

    const isNewStep = step !== prevStep.current
    prevStep.current = step

    const sel = currentStep?.selector
    const el = sel ? document.querySelector(sel) : null

    if (el && isNewStep) {
      // Scroll the target to the centre of the viewport, then measure
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      const t = setTimeout(computeSpot, 400)
      return () => clearTimeout(t)
    }

    // No scroll needed (welcome step or element already visible)
    const t = setTimeout(computeSpot, 60)
    return () => clearTimeout(t)
  }, [isActive, mounted, navigating, step, computeSpot])

  // ── Recompute live while the user scrolls (no scrollIntoView here) ───────
  useEffect(() => {
    if (!isActive || !mounted) return
    window.addEventListener("scroll", computeSpot, { passive: true, capture: true })
    return () => window.removeEventListener("scroll", computeSpot, true)
  }, [isActive, mounted, computeSpot])

  if (!mounted || !isActive) return null

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* ── SVG overlay with punched-out spotlight ── */}
          <motion.svg
            key="onboarding-svg"
            className="fixed inset-0 z-[300]"
            width={vw}
            height={vh}
            style={{ pointerEvents: "all" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={next}
          >
            <defs>
              <mask id="onboarding-mask">
                <rect x={0} y={0} width={vw} height={vh} fill="white" />
                <motion.rect
                  animate={{ x: spot.x, y: spot.y, width: spot.w, height: spot.h }}
                  transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
                  rx={14}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x={0} y={0} width={vw} height={vh}
              fill="rgba(0,0,0,0.72)"
              mask="url(#onboarding-mask)"
            />
          </motion.svg>

          {/* ── Indigo glow ring ── */}
          {currentStep.selector && (
            <motion.div
              className="fixed z-[301] rounded-2xl pointer-events-none"
              animate={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
              transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
              style={{
                boxShadow:
                  "0 0 0 2.5px rgba(99,102,241,0.9), 0 0 0 6px rgba(99,102,241,0.18), 0 0 28px 4px rgba(99,102,241,0.25)",
              }}
            />
          )}

          {/* ── Tooltip card ── */}
          <motion.div
            key={`tooltip-${step}`}
            className="fixed z-[302] pointer-events-auto"
            style={tooltip}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.06 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-[#1c1a2e] rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-indigo-900/60 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <div className="p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    {step + 1} / {ONBOARDING_STEPS.length}
                  </span>
                  <button
                    onClick={skip}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <HiXMark className="text-xs" /> Skip tour
                  </button>
                </div>

                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1 leading-snug">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                  {currentStep.body}
                </p>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={prev}
                    disabled={step === 0}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-0 transition-colors"
                  >
                    <HiArrowLeft className="text-sm" /> Back
                  </button>

                  <div className="flex items-center gap-1">
                    {ONBOARDING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          i === step
                            ? "w-4 h-1.5 bg-indigo-500"
                            : i < step
                            ? "w-1.5 h-1.5 bg-indigo-300 dark:bg-indigo-700"
                            : "w-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={next}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    {isLastStep ? "Done" : "Next"}
                    {!isLastStep && <HiArrowRight className="text-sm" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
