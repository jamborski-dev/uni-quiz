"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { HiChevronRight } from "react-icons/hi2"

const BLOCKS = [
  {
    id: 1,
    label: "Block 1",
    title: "The Digital World",
    description: "Computers, binary, databases, HCI",
    light: "border-indigo-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/60",
    dark: "dark:border-indigo-900 dark:hover:border-indigo-700 dark:bg-[#1a1828] dark:hover:bg-indigo-950/60",
    badge: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    id: 2,
    label: "Block 2",
    title: "Creating Solutions",
    description: "Algorithms, Scratch, loops, functions",
    light: "border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/60",
    dark: "dark:border-emerald-900 dark:hover:border-emerald-700 dark:bg-[#1a1828] dark:hover:bg-emerald-950/60",
    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: 3,
    label: "Block 3",
    title: "Connecting People",
    description: "Networks, protocols, IoT, ethics",
    light: "border-violet-200 hover:border-violet-300 bg-white hover:bg-violet-50/60",
    dark: "dark:border-violet-900 dark:hover:border-violet-700 dark:bg-[#1a1828] dark:hover:bg-violet-950/60",
    badge: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
]

export default function BlockSelector() {
  return (
    <motion.div
      className="w-full max-w-sm flex flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {BLOCKS.map((block, i) => (
        <motion.div
          key={block.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: i * 0.08 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href={`/quiz/${block.id}`}
            className={`flex items-center justify-between border-2 rounded-2xl p-4 transition-colors duration-200 shadow-sm ${block.light} ${block.dark}`}
          >
            <div>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${block.badge}`}>
                {block.label}
              </span>
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{block.title}</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{block.description}</p>
            </div>
            <HiChevronRight className="text-zinc-300 dark:text-zinc-600 text-xl shrink-0 ml-3" />
          </Link>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.24 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link
          href="/quiz/all"
          className="flex items-center justify-between bg-white dark:bg-[#1a1828] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors duration-200 shadow-sm"
        >
          <div>
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              All Blocks
            </span>
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Mixed Quiz</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Questions from all topics</p>
          </div>
          <HiChevronRight className="text-zinc-300 dark:text-zinc-600 text-xl shrink-0 ml-3" />
        </Link>
      </motion.div>
    </motion.div>
  )
}
