"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "motion/react"
import { HiChartBar, HiExclamationTriangle, HiCheckBadge, HiQuestionMarkCircle, HiSparkles } from "react-icons/hi2"
import { useAuth } from "@/hooks/useAuth"
import { useToastStore } from "@/store/toast"
import { useNotificationsStore } from "@/store/notifications"
import PageTransition from "@/components/PageTransition"
import Tooltip from "@/components/Tooltip"
import type { GenerationStatus, AppNotification } from "@/lib/types"

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

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function accuracy(correct: number, total: number) {
  if (total === 0) return null
  return Math.round((correct / total) * 100)
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr).getTime()
  const remaining = target - Date.now()
  if (remaining <= 0) return 0
  return Math.ceil(remaining / (1000 * 60 * 60 * 24))
}

export default function ProgressPage() {
  const { userId } = useAuth()
  const { addToast } = useToastStore()
  const { addItem } = useNotificationsStore()

  const [groups, setGroups] = useState<BlockGroup[]>([])
  const [loading, setLoading] = useState(true)
  // Keyed by "block:all" (block-level) or "block:topicName" (topic-level)
  const [generationStatus, setGenerationStatus] = useState<Map<string, GenerationStatus>>(new Map())
  // Tracks which generate key is currently in-flight
  const [generating, setGenerating] = useState<string | null>(null)

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

  const fetchGenerationStatus = useCallback(() => {
    if (!userId) return
    fetch(`/api/generate?user_id=${userId}`)
      .then((r) => r.json())
      .then(({ generations }: { generations: GenerationStatus[] }) => {
        const map = new Map<string, GenerationStatus>()
        for (const g of generations) {
          const key = `${g.block}:${g.topic ?? "all"}`
          map.set(key, g)
        }
        setGenerationStatus(map)
      })
      .catch(() => {})
  }, [userId])

  useEffect(() => {
    if (groups.length > 0) fetchGenerationStatus()
  }, [groups.length, fetchGenerationStatus])

  async function handleGenerate(block: number, topic?: string) {
    if (!userId || generating !== null) return
    const genKey = `${block}:${topic ?? "all"}`
    setGenerating(genKey)
    const blockLabel = block === 4 ? "Maths" : `Block ${block}`
    const label = topic ? `"${topic}"` : blockLabel
    addToast({ type: "info", title: `Generating questions for ${label}…`, message: "This may take a few seconds", timeout: 4000 })

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block, topic, user_id: userId }),
      })
      const data = await res.json()

      if (!res.ok) {
        addToast({ type: "error", title: "Generation failed", message: data.error ?? "Unknown error", timeout: 0 })
        return
      }

      addToast({
        type: "success",
        title: "Questions generated!",
        message: `${data.count} new questions added for ${label}.`,
        timeout: 5000,
      })

      const notif: AppNotification = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: "New questions generated",
        message: `${data.count} new questions added for ${label}.`,
        type: "success",
        is_read: false,
        created_at: new Date().toISOString(),
      }
      addItem(notif)
      fetchGenerationStatus()
    } catch {
      addToast({ type: "error", title: "Generation failed", message: "Network error — please try again", timeout: 0 })
    } finally {
      setGenerating(null)
    }
  }

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
              const canGenerate = userId && groupAcc !== null && groupAcc >= 90
              const blockGenKey = `${group.block}:all`
              const blockGenStatus = generationStatus.get(blockGenKey)
              const blockNextAvailable = blockGenStatus
                ? new Date(blockGenStatus.generated_at).getTime() + SEVEN_DAYS_MS
                : null
              const blockOnCooldown = blockNextAvailable !== null && blockNextAvailable > Date.now()
              const blockDaysLeft = blockOnCooldown && blockNextAvailable ? daysUntil(new Date(blockNextAvailable).toISOString()) : 0
              const isBlockGenerating = generating === blockGenKey

              return (
                <motion.div
                  key={group.block}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + gi * 0.06 }}
                  className={`bg-white dark:bg-[#1a1828] rounded-2xl border-2 ${group.color} shadow-sm overflow-hidden`}
                >
                  {/* Block header */}
                  <div className="px-4 pt-3.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
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

                    {/* Block-level generate button */}
                    {(() => {
                      const locked = !canGenerate || blockOnCooldown || !!generating
                      const tooltip = !userId
                        ? "Sign in to generate questions"
                        : !canGenerate
                        ? "Reach 90% block accuracy to unlock"
                        : blockOnCooldown
                        ? `Available in ${blockDaysLeft} day${blockDaysLeft !== 1 ? "s" : ""}`
                        : ""
                      return (
                        <div className="mt-2.5" data-onboarding="gen-questions">
                          <Tooltip content={tooltip} wrapDisabled={locked} side="top">
                          <button
                            onClick={() => !locked && handleGenerate(group.block)}
                            disabled={locked}
                            className={`flex items-center gap-1.5 text-[10px] font-semibold rounded-lg px-2.5 py-1.5 border transition-colors
                              ${locked
                                ? "grayscale opacity-40 cursor-not-allowed bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                                : "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60"
                              }`}
                          >
                            {isBlockGenerating ? (
                              <>
                                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                Generating…
                              </>
                            ) : (
                              <>
                                <HiSparkles className="text-xs" />
                                Generate for all topics
                                {blockOnCooldown && <span className="font-normal ml-0.5">· {blockDaysLeft}d</span>}
                                {blockGenStatus && !blockOnCooldown && (
                                  <span className="font-normal ml-0.5 text-zinc-400 dark:text-zinc-500">
                                    · last {new Date(blockGenStatus.generated_at).toLocaleDateString()}
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                          </Tooltip>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Topics */}
                  <div className="px-4 py-2 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {group.topics.map((topic, ti) => {
                      const acc = accuracy(topic.correct, topic.total_answers)
                      const pct = acc ?? 0
                      const isWeak = topic.total_answers > 0 && topic.weakness_score > 0.6
                      const isStrong = topic.total_answers > 0 && topic.weakness_score <= 0.4
                      const seen = topic.total_answers > 0

                      // Per-topic generation state
                      const topicGenKey = `${group.block}:${topic.topic}`
                      const topicCanGenerate = userId && acc !== null && acc >= 90
                      const topicGenStatus = generationStatus.get(topicGenKey)
                      const topicNextAvailable = topicGenStatus
                        ? new Date(topicGenStatus.generated_at).getTime() + SEVEN_DAYS_MS
                        : null
                      const topicOnCooldown = topicNextAvailable !== null && topicNextAvailable > Date.now()
                      const topicDaysLeft = topicOnCooldown && topicNextAvailable
                        ? daysUntil(new Date(topicNextAvailable).toISOString())
                        : 0
                      const isTopicGenerating = generating === topicGenKey
                      const topicLocked = !topicCanGenerate || topicOnCooldown || !!generating
                      const topicTooltip = !userId
                        ? "Sign in to generate"
                        : !topicCanGenerate
                        ? "Reach 90% on this topic to unlock"
                        : topicOnCooldown
                        ? `Available in ${topicDaysLeft}d`
                        : "Generate new questions for this topic"

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
                            <div className="flex items-center gap-2 shrink-0 ml-2">
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
                              {/* Per-topic generate button */}
                              <Tooltip content={topicTooltip} wrapDisabled={topicLocked} side="top">
                              <button
                                onClick={() => !topicLocked && handleGenerate(group.block, topic.topic)}
                                disabled={topicLocked}
                                className={`flex items-center gap-1 transition-colors rounded-md px-1.5 py-1 border text-[9px] font-semibold ${
                                  topicLocked
                                    ? "grayscale opacity-35 cursor-not-allowed border-indigo-200 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400"
                                    : "border-indigo-200 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                }`}
                              >
                                {isTopicGenerating ? (
                                  <div className="w-2.5 h-2.5 border-[1.5px] border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <HiSparkles className="text-[9px]" />
                                    {topicOnCooldown ? `${topicDaysLeft}d` : "Gen"}
                                  </>
                                )}
                              </button>
                              </Tooltip>
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
