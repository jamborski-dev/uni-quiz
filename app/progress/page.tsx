"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { HiChartBar, HiExclamationTriangle, HiCheckBadge, HiQuestionMarkCircle } from "react-icons/hi2"
import { useAuth } from "@/hooks/useAuth"
import PageTransition from "@/components/PageTransition"

const TOPIC_ORDER: Record<string, number> = Object.fromEntries([
  // Block 1
  "Living in a digital world",
  "The evolving computer",
  "Digital media",
  "A world built of data",
  "Weaving the web",
  "Crossing boundaries - HCI and design",
  // Block 2
  "Programming with Scratch - sequences and sprites",
  "Numbers, strings and lists",
  "Selection and Booleans",
  "Loops",
  "Nested structures and modularity",
  "Algorithms and sorting",
  // Block 3
  "Network technologies",
  "The internet",
  "Wireless communications",
  "The Internet of Things",
  "Online communication",
  "The networked society",
  // Block 4 (Maths)
  "Percentages",
  "Exponent notation",
  "Scientific notation",
  "Binary and number systems",
  "Equations and substitution",
  "Inverse square law",
].map((topic, i) => [topic, i]))

interface TopicRow {
  block: number
  topic: string
  total_questions: number
  total_answers: number
  correct: number
  weakness_score: number
}

interface BlockGroup {
  block: number
  label: string
  color: string
  badgeClass: string
  barClass: string
  topics: TopicRow[]
}

const BLOCK_META: Record<number, { label: string; color: string; badgeClass: string; barClass: string }> = {
  1: { label: "Block 1 - The Digital World",    color: "border-indigo-400 dark:border-indigo-600",  badgeClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",  barClass: "bg-indigo-500 dark:bg-indigo-400" },
  2: { label: "Block 2 - Creating Solutions",   color: "border-emerald-400 dark:border-emerald-600", badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", barClass: "bg-emerald-500 dark:bg-emerald-400" },
  3: { label: "Block 3 - Connecting People",    color: "border-violet-400 dark:border-violet-600",  badgeClass: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",  barClass: "bg-violet-500 dark:bg-violet-400" },
  4: { label: "Maths - Using Numbers",          color: "border-amber-400 dark:border-amber-600",    badgeClass: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",    barClass: "bg-amber-500 dark:bg-amber-400" },
}

function accuracy(correct: number, total: number) {
  if (total === 0) return null
  return Math.round((correct / total) * 100)
}

export default function ProgressPage() {
  const { userId } = useAuth()
  const [groups, setGroups] = useState<BlockGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = userId ? `/api/progress?user_id=${userId}` : "/api/progress"
    fetch(url)
      .then((r) => r.json())
      .then(({ topics }: { topics: TopicRow[] }) => {
        const map = new Map<number, TopicRow[]>()
        for (const t of topics) {
          if (!map.has(t.block)) map.set(t.block, [])
          map.get(t.block)!.push(t)
        }
        // Sort each block's topics by book order
        for (const [, topicList] of map) {
          topicList.sort((a, b) => (TOPIC_ORDER[a.topic] ?? 99) - (TOPIC_ORDER[b.topic] ?? 99))
        }
        const built: BlockGroup[] = []
        for (const [block, topicList] of map) {
          const meta = BLOCK_META[block] ?? { label: `Block ${block}`, color: "", badgeClass: "", barClass: "bg-zinc-400" }
          built.push({ block, ...meta, topics: topicList })
        }
        built.sort((a, b) => a.block - b.block)
        setGroups(built)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  // Overall stats
  const allTopics = groups.flatMap((g) => g.topics)
  const totalAnswered = allTopics.reduce((s, t) => s + t.total_answers, 0)
  const totalCorrect = allTopics.reduce((s, t) => s + t.correct, 0)
  const totalQuestions = allTopics.reduce((s, t) => s + t.total_questions, 0)
  const overallAcc = accuracy(totalCorrect, totalAnswered)
  const weakTopics = allTopics.filter((t) => t.total_answers > 0 && t.weakness_score > 0.6).length

  return (
    <PageTransition>
      <main className="min-h-screen px-4 pt-6 pb-8 max-w-sm mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <HiChartBar className="text-indigo-500 dark:text-indigo-400 text-xl" />
            <h1 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight">Progress</h1>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Your performance across all topics</p>
          {!userId && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Not signed in - stats are not being tracked</p>
          )}
        </motion.div>

        {/* Overall summary cards */}
        <motion.div
          className="grid grid-cols-3 gap-2 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="bg-white dark:bg-[#1a1828] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 text-center">
            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{totalQuestions}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">Questions</p>
          </div>
          <div className="bg-white dark:bg-[#1a1828] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 text-center">
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {overallAcc !== null ? `${overallAcc}%` : "-"}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">Accuracy</p>
          </div>
          <div className="bg-white dark:bg-[#1a1828] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 text-center">
            <p className={`text-lg font-extrabold ${weakTopics > 0 ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"}`}>
              {weakTopics}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">Weak</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group, gi) => {
              const groupAnswered = group.topics.reduce((s, t) => s + t.total_answers, 0)
              const groupCorrect = group.topics.reduce((s, t) => s + t.correct, 0)
              const groupAcc = accuracy(groupCorrect, groupAnswered)

              return (
                <motion.div
                  key={group.block}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + gi * 0.06 }}
                  className={`bg-white dark:bg-[#1a1828] rounded-2xl border-2 ${group.color} shadow-sm overflow-hidden`}
                >
                  {/* Block header */}
                  <div className="px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${group.badgeClass}`}>
                        {group.block === 4 ? "Maths" : `Block ${group.block}`}
                      </span>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 mt-1">
                        {group.label.split(" - ")[1]}
                      </p>
                    </div>
                    {groupAcc !== null ? (
                      <div className="text-right">
                        <p className="text-base font-extrabold text-zinc-800 dark:text-zinc-100">{groupAcc}%</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{groupCorrect}/{groupAnswered} correct</p>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-300 dark:text-zinc-600">Not started</p>
                    )}
                  </div>

                  {/* Topics */}
                  <div className="px-4 py-2 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {group.topics.map((topic, ti) => {
                      const acc = accuracy(topic.correct, topic.total_answers)
                      const pct = acc ?? 0
                      const isWeak = topic.total_answers > 0 && topic.weakness_score > 0.6
                      const isStrong = topic.total_answers > 0 && topic.weakness_score <= 0.4
                      const seen = topic.total_answers > 0

                      return (
                        <motion.div
                          key={topic.topic}
                          className="py-2.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 + gi * 0.06 + ti * 0.02 }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isWeak ? (
                                <HiExclamationTriangle className="text-amber-400 text-xs shrink-0" />
                              ) : isStrong ? (
                                <HiCheckBadge className="text-emerald-500 dark:text-emerald-400 text-xs shrink-0" />
                              ) : (
                                <HiQuestionMarkCircle className="text-zinc-300 dark:text-zinc-600 text-xs shrink-0" />
                              )}
                              <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 shrink-0 tabular-nums">
                                {group.block}.{ti + 1}
                              </span>
                              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                {topic.topic}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {seen ? (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                                  isWeak
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                    : isStrong
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                }`}>
                                  {topic.correct}/{topic.total_answers}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-300 dark:text-zinc-600">
                                  {topic.total_questions}q
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            {seen && (
                              <motion.div
                                className={`h-full rounded-full ${
                                  isWeak
                                    ? "bg-amber-400"
                                    : isStrong
                                    ? "bg-emerald-500 dark:bg-emerald-400"
                                    : group.barClass
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 + gi * 0.06 + ti * 0.03 }}
                              />
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </PageTransition>
  )
}
