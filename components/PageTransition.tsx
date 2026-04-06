"use client"

import { motion } from "motion/react"

/**
 * Wraps each page with an enter-only animation.
 * Exit is intentionally omitted — App Router removes the old page
 * synchronously, so exit animations are unreliable and cause blank screens.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
