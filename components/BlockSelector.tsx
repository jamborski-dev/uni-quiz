"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { HiChevronDown, HiChevronRight, HiPlayCircle, HiExclamationCircle } from "react-icons/hi2"
import { useAuth } from "@/hooks/useAuth"
import { useUIStore } from "@/store/ui"
import type { TopicStats } from "@/lib/types"

// Topic structure maps to TM111 book parts
const BLOCKS = [
  {
    id: 1,
    label: "Block 1",
    title: "The Digital World",
    description: "Digital society, computers, media, data, web, HCI",
    light: "border-indigo-200 bg-white",
    dark: "dark:border-indigo-900 dark:bg-[#1a1828]",
    activeLight: "border-indigo-400 bg-indigo-50/60",
    activeDark: "dark:border-indigo-600 dark:bg-indigo-950/40",
    badge: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    topics: [
      "Living in a digital world",
      "The evolving computer",
      "Digital media",
      "A world built of data",
      "Weaving the web",
      "Crossing boundaries - HCI and design",
    ],
  },
  {
    id: 2,
    label: "Block 2",
    title: "Creating Solutions",
    description: "Scratch, algorithms, loops, sorting, modularity",
    light: "border-emerald-200 bg-white",
    dark: "dark:border-emerald-900 dark:bg-[#1a1828]",
    activeLight: "border-emerald-400 bg-emerald-50/60",
    activeDark: "dark:border-emerald-600 dark:bg-emerald-950/40",
    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    topics: [
      "Programming with Scratch - sequences and sprites",
      "Numbers, strings and lists",
      "Selection and Booleans",
      "Loops",
      "Nested structures and modularity",
      "Algorithms and sorting",
    ],
  },
  {
    id: 3,
    label: "Block 3",
    title: "Connecting People",
    description: "Networks, internet, wireless, IoT, society",
    light: "border-violet-200 bg-white",
    dark: "dark:border-violet-900 dark:bg-[#1a1828]",
    activeLight: "border-violet-400 bg-violet-50/60",
    activeDark: "dark:border-violet-600 dark:bg-violet-950/40",
    badge: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    topics: [
      "Network technologies",
      "The internet",
      "Wireless communications",
      "The Internet of Things",
      "Online communication",
      "The networked society",
    ],
  },
  {
    id: 4,
    label: "Maths",
    title: "Using Numbers",
    description: "Percentages, binary, exponents, equations",
    light: "border-amber-200 bg-white",
    dark: "dark:border-amber-900 dark:bg-[#1a1828]",
    activeLight: "border-amber-400 bg-amber-50/60",
    activeDark: "dark:border-amber-600 dark:bg-amber-950/40",
    badge: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    topics: [
      "Percentages",
      "Exponent notation",
      "Scientific notation",
      "Binary and number systems",
      "Equations and substitution",
      "Inverse square law",
    ],
  },
]

export default function BlockSelector() {
  const router = useRouter()
  const { userId } = useAuth()
  const { navigatingTo, startNavigation, endNavigation } = useUIStore()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [topicStats, setTopicStats] = useState<Map<string, TopicStats>>(new Map())

  // Clear any stale navigation state when returning to this page
  useEffect(() => {
    endNavigation()
  }, [endNavigation])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/topic-stats?user_id=${userId}`)
      .then((r) => r.json())
      .then(({ stats }: { stats: TopicStats[] }) => {
        const map = new Map<string, TopicStats>()
        for (const s of stats) map.set(s.topic, s)
        setTopicStats(map)
      })
      .catch(() => {})
  }, [userId])

  function isWeak(topic: string) {
    const s = topicStats.get(topic)
    return s && s.total_answers > 0 && s.weakness_score > 0.6
  }

  function isStrong(topic: string) {
    const s = topicStats.get(topic)
    return s && s.total_answers > 0 && s.weakness_score <= 0.4
  }

  function startQuiz(blockId: number, topic?: string) {
    const key = topic ? `${blockId}:${topic}` : `${blockId}:all`
    if (navigatingTo) return
    startNavigation(key)
    if (topic) {
      router.push(`/quiz/${blockId}?topic=${encodeURIComponent(topic)}`)
    } else {
      router.push(`/quiz/${blockId}`)
    }
  }

  return (
    <motion.div
      className="w-full max-w-sm flex flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {BLOCKS.map((block, i) => {
        const isOpen = expanded === block.id
        const weakCount = block.topics.filter(isWeak).length

        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: i * 0.07 }}
          >
            {/* Block header */}
            <motion.button
              onClick={() => setExpanded(isOpen ? null : block.id)}
              className={`w-full flex items-center justify-between border-2 rounded-2xl p-4 transition-colors duration-200 shadow-sm text-left
                ${isOpen
                  ? `${block.activeLight} ${block.activeDark}`
                  : `${block.light} ${block.dark}`
                }`}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${block.badge}`}>
                    {block.label}
                  </span>
                  {weakCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <HiExclamationCircle className="text-sm" />
                      {weakCount} weak
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{block.title}</h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{block.description}</p>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 shrink-0"
              >
                <HiChevronDown className="text-zinc-300 dark:text-zinc-600 text-xl" />
              </motion.div>
            </motion.button>

            {/* Expandable topic list */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden px-1 -mx-1"
                >
                  <div className="mt-2 flex flex-col gap-1.5 pl-2">
                    {/* Start all topics */}
                    {(() => {
                      const key = `${block.id}:all`
                      const isLoading = navigatingTo === key
                      return (
                        <motion.button
                          onClick={() => startQuiz(block.id)}
                          disabled={!!navigatingTo}
                          className="flex items-center justify-between w-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors disabled:opacity-60"
                          whileHover={navigatingTo ? {} : { x: 2 }}
                          whileTap={navigatingTo ? {} : { scale: 0.97 }}
                        >
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            All topics - {block.label}
                          </span>
                          {isLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiPlayCircle className="text-base text-zinc-400 dark:text-zinc-500" />
                          )}
                        </motion.button>
                      )
                    })()}

                    {/* Individual topics */}
                    {block.topics.map((topic, ti) => {
                      const weak = isWeak(topic)
                      const strong = isStrong(topic)
                      const key = `${block.id}:${topic}`
                      const isLoading = navigatingTo === key
                      return (
                        <motion.button
                          key={topic}
                          onClick={() => startQuiz(block.id, topic)}
                          disabled={!!navigatingTo}
                          className="flex items-center justify-between w-full bg-white dark:bg-[#1a1828] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-left group disabled:opacity-60"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.18, delay: ti * 0.03 }}
                          whileHover={navigatingTo ? {} : { x: 2 }}
                          whileTap={navigatingTo ? {} : { scale: 0.97 }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`shrink-0 w-1.5 h-1.5 rounded-full transition-colors ${
                                weak
                                  ? "bg-amber-400"
                                  : strong
                                  ? "bg-emerald-400 dark:bg-emerald-500"
                                  : "bg-zinc-200 dark:bg-zinc-700"
                              }`}
                            />
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                              {topic}
                            </span>
                          </div>
                          {isLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0 ml-2" />
                          ) : (
                            <HiChevronRight className="text-zinc-300 dark:text-zinc-600 text-sm shrink-0 ml-2 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Mixed quiz */}
      {(() => {
        const key = "mixed"
        const isLoading = navigatingTo === key
        return (
          <motion.button
            onClick={() => {
              if (navigatingTo) return
              startNavigation(key)
              router.push("/quiz/all")
            }}
            disabled={!!navigatingTo}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: BLOCKS.length * 0.07 }}
            whileHover={navigatingTo ? {} : { scale: 1.005 }}
            whileTap={navigatingTo ? {} : { scale: 0.98 }}
            className="w-full flex items-center justify-between bg-white dark:bg-[#1a1828] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-200 shadow-sm text-left disabled:opacity-60"
          >
            <div className="flex-1 min-w-0">
              <div className="mb-1.5">
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Mixed
                </span>
              </div>
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Mixed Quiz</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Questions from all topics</p>
            </div>
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0 ml-3" />
            ) : (
              <HiChevronRight className="text-zinc-300 dark:text-zinc-600 text-xl shrink-0 ml-3" />
            )}
          </motion.button>
        )
      })()}
    </motion.div>
  )
}
