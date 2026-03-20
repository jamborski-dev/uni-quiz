"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  HiArrowPath,
  HiHome,
  HiTrophy,
  HiFaceSmile,
  HiBookOpen,
  HiChevronDown,
  HiChevronUp,
  HiExclamationCircle,
} from "react-icons/hi2"
import { useAuth } from "@/hooks/useAuth"
import type { SessionResult, SessionAnswer, FurtherReading } from "@/lib/types"

interface Props {
  score: number
  total: number
  block: string
}

const SESSION_KEY = "quiz_session_result"

interface TopicGroup {
  topic: string
  block: number
  answers: SessionAnswer[]
  correct: number
  pct: number
  topicSummary: string
  furtherReading: FurtherReading[]
}

function groupByTopic(answers: SessionAnswer[]): TopicGroup[] {
  const map = new Map<string, SessionAnswer[]>()
  for (const a of answers) {
    const g = map.get(a.topic) ?? []
    g.push(a)
    map.set(a.topic, g)
  }
  return Array.from(map.entries()).map(([topic, topicAnswers]) => {
    const correct = topicAnswers.filter((a) => a.isCorrect).length
    const pct = Math.round((correct / topicAnswers.length) * 100)
    return {
      topic,
      block: topicAnswers[0].block,
      answers: topicAnswers,
      correct,
      pct,
      topicSummary: topicAnswers[0].topicSummary ?? "",
      furtherReading: topicAnswers[0].furtherReading ?? [],
    }
  })
}

export default function ResultsScreen({ score, total, block }: Props) {
  const router = useRouter()
  const { userId } = useAuth()
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [persisting, setPersisting] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const blockLabel = block === "all" ? "All Blocks" : block === "4" ? "Maths" : `Block ${block}`

  const { message, Icon, scoreColor } =
    pct >= 90
      ? { message: "Outstanding result!", Icon: HiTrophy, scoreColor: "text-emerald-500 dark:text-emerald-400" }
      : pct >= 70
      ? { message: "Great work - keep it up!", Icon: HiFaceSmile, scoreColor: "text-indigo-500 dark:text-indigo-400" }
      : pct >= 50
      ? { message: "Not bad - keep revising!", Icon: HiBookOpen, scoreColor: "text-amber-500 dark:text-amber-400" }
      : { message: "Keep practising - you've got this!", Icon: HiBookOpen, scoreColor: "text-red-400 dark:text-red-400" }

  const persistSession = useCallback(
    async (result: SessionResult) => {
      if (!userId) return
      setPersisting(true)
      try {
        await fetch("/api/session-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            block: result.block,
            answers: result.answers,
          }),
        })
      } catch {
        // Non-fatal
      } finally {
        setPersisting(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const result: SessionResult = JSON.parse(raw)
        setSessionResult(result)
        // Auto-expand weak topics
        const weakTopics = new Set<string>()
        groupByTopic(result.answers)
          .filter((g) => g.pct < 60)
          .forEach((g) => weakTopics.add(g.topic))
        setExpandedTopics(weakTopics)
        persistSession(result)
      }
    } catch {
      // sessionStorage not available
    }
  }, [persistSession])

  const topicGroups = sessionResult ? groupByTopic(sessionResult.answers) : []
  const weakGroups = topicGroups.filter((g) => g.pct < 60)

  function toggleTopic(topic: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  function handleRetryWeak() {
    if (!weakGroups.length) return
    const weakTopics = weakGroups.map((g) => g.topic).join(",")
    const blockNum = weakGroups[0].block
    router.push(`/quiz/${blockNum}?topics=${encodeURIComponent(weakTopics)}`)
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: "easeOut" as const, delay },
  })

  return (
    <div className="w-full max-w-sm pb-10 pt-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="text-center mb-5">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Quiz Complete</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{blockLabel}</p>
        {persisting && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Saving progress...</p>
        )}
      </motion.div>

      {/* Score card */}
      <motion.div
        {...fadeUp(0.08)}
        className="bg-white dark:bg-[#1a1828] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2d2a40] p-8 mb-4 text-center"
      >
        <Icon className={`text-4xl mx-auto mb-3 ${scoreColor}`} />
        <p className={`text-6xl font-extrabold ${scoreColor}`}>{pct}%</p>
        <p className="text-zinc-400 dark:text-zinc-500 mt-2 text-sm">
          {score} correct out of {total}
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300 font-medium text-sm">{message}</p>
      </motion.div>

      {/* Per-topic breakdown */}
      {topicGroups.length > 0 && (
        <motion.div {...fadeUp(0.14)} className="mb-4">
          <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1">
            Topic breakdown
          </h2>
          <div className="flex flex-col gap-2">
            {topicGroups.map((group) => {
              const isWeak = group.pct < 60
              const isExpanded = expandedTopics.has(group.topic)

              return (
                <div key={group.topic}>
                  <button
                    onClick={() => toggleTopic(group.topic)}
                    className={`w-full flex items-center justify-between bg-white dark:bg-[#1a1828] border rounded-xl px-4 py-3 transition-colors text-left ${
                      isWeak
                        ? "border-amber-200 dark:border-amber-900"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isWeak && (
                        <HiExclamationCircle className="text-amber-500 dark:text-amber-400 text-base shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                          {group.topic}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {group.correct} / {group.answers.length} correct
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span
                        className={`text-sm font-bold ${
                          group.pct >= 70
                            ? "text-emerald-500 dark:text-emerald-400"
                            : group.pct >= 50
                            ? "text-amber-500 dark:text-amber-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {group.pct}%
                      </span>
                      {isWeak && (
                        isExpanded
                          ? <HiChevronUp className="text-zinc-400 text-sm" />
                          : <HiChevronDown className="text-zinc-400 text-sm" />
                      )}
                    </div>
                  </button>

                  {/* Expanded: topic summary and further reading */}
                  {isExpanded && group.pct < 60 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 border-t-0 rounded-b-xl px-4 py-3 overflow-hidden"
                    >
                      {group.topicSummary && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                          {group.topicSummary}
                        </p>
                      )}
                      {group.furtherReading.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                            Further reading:
                          </p>
                          <ul className="flex flex-col gap-1">
                            {group.furtherReading.map((ref, i) => (
                              <li
                                key={i}
                                className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5"
                              >
                                <span className="shrink-0 text-amber-500 dark:text-amber-400 font-bold">
                                  p.{ref.page}
                                </span>
                                <span>{ref.label}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div {...fadeUp(0.22)} className="flex flex-col gap-3">
        {weakGroups.length > 0 && (
          <motion.button
            onClick={handleRetryWeak}
            className="flex items-center justify-center gap-2 bg-amber-500 dark:bg-amber-600 text-white rounded-xl py-3.5 font-semibold text-sm shadow-sm w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <HiExclamationCircle className="text-base" />
            Try weak topics again
          </motion.button>
        )}

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <a
            href={`/quiz/${block}`}
            className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <HiArrowPath className="text-base" />
            Try Again
          </a>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <a
            href="/"
            className="flex items-center justify-center gap-2 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl py-3.5 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HiHome className="text-base" />
            Back to topics
          </a>
        </motion.div>
      </motion.div>
    </div>
  )
}
