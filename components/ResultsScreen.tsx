"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { HiArrowPath, HiHome, HiTrophy, HiFaceSmile, HiBookOpen } from "react-icons/hi2"

interface Props {
  score: number
  total: number
  block: string
}

export default function ResultsScreen({ score, total, block }: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const blockLabel = block === "all" ? "All Blocks" : `Block ${block}`

  const { message, Icon, scoreColor } =
    pct >= 90
      ? { message: "Outstanding result!", Icon: HiTrophy, scoreColor: "text-emerald-500 dark:text-emerald-400" }
      : pct >= 70
      ? { message: "Good job! Nearly there.", Icon: HiFaceSmile, scoreColor: "text-indigo-500 dark:text-indigo-400" }
      : pct >= 50
      ? { message: "Not bad — keep revising!", Icon: HiBookOpen, scoreColor: "text-amber-500 dark:text-amber-400" }
      : { message: "Keep practising - you've got this!", Icon: HiBookOpen, scoreColor: "text-red-400 dark:text-red-400" }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: "easeOut" as const, delay },
  })

  return (
    <div className="w-full max-w-sm text-center">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Quiz Complete</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">{blockLabel}</p>
      </motion.div>

      <motion.div
        {...fadeUp(0.09)}
        className="bg-white dark:bg-[#1a1828] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2d2a40] p-8 mb-5"
      >
        <Icon className={`text-4xl mx-auto mb-3 ${scoreColor}`} />
        <p className={`text-6xl font-extrabold ${scoreColor}`}>{pct}%</p>
        <p className="text-zinc-400 dark:text-zinc-500 mt-2 text-sm">
          {score} correct out of {total}
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300 font-medium text-sm">{message}</p>
      </motion.div>

      <motion.div {...fadeUp(0.18)} className="flex flex-col gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            href={`/quiz/${block}`}
            className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <HiArrowPath className="text-base" />
            Try Again
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl py-3.5 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HiHome className="text-base" />
            Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
