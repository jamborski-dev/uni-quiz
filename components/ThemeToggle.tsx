"use client"

import { motion, AnimatePresence } from "motion/react"
import { HiSun, HiMoon } from "react-icons/hi2"
import { useTheme } from "@/components/ThemeProvider"

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <motion.button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-amber-400"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.88 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -60, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 60, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18 }}
          className="block text-lg leading-none"
        >
          {theme === "dark" ? <HiSun /> : <HiMoon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
