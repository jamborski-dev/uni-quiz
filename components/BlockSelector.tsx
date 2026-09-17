"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { HiChevronDown, HiChevronRight, HiPlayCircle, HiExclamationCircle } from "react-icons/hi2"
import { useAuth } from "@/hooks/useAuth"
import { useUIStore } from "@/store/ui"
import type { TopicStats } from "@/lib/types"

// Topic structure maps to CompTIA Security+ SY0-701 exam domains
const BLOCKS = [
  {
    id: 1,
    label: "Domain 1",
    title: "General Security Concepts",
    description: "Security controls, CIA triad, cryptography, change management",
    light: "border-indigo-200 bg-white",
    dark: "dark:border-indigo-900 dark:bg-[#1a1828]",
    activeLight: "border-indigo-400 bg-indigo-50/60",
    activeDark: "dark:border-indigo-600 dark:bg-indigo-950/40",
    badge: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    topics: [
      { name: "Fundamentals of Security",  courseSection: 2  },
      { name: "Cryptographic Solutions",   courseSection: 8  },
      { name: "Change Management",         courseSection: 12 },
    ],
  },
  {
    id: 2,
    label: "Domain 2",
    title: "Threats, Vulnerabilities & Mitigations",
    description: "Threat actors, social engineering, malware, attacks, hardening",
    light: "border-rose-200 bg-white",
    dark: "dark:border-rose-900 dark:bg-[#1a1828]",
    activeLight: "border-rose-400 bg-rose-50/60",
    activeDark: "dark:border-rose-600 dark:bg-rose-950/40",
    badge: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    topics: [
      { name: "Threat Actors",             courseSection: 3  },
      { name: "Physical Security",         courseSection: 4  },
      { name: "Social Engineering",        courseSection: 5  },
      { name: "Malware",                   courseSection: 6  },
      { name: "Vulnerabilities and Attacks", courseSection: 18 },
      { name: "Malicious Activity",        courseSection: 19 },
      { name: "Hardening",                 courseSection: 20 },
    ],
  },
  {
    id: 3,
    label: "Domain 3",
    title: "Security Architecture",
    description: "Data protection, resilience, cloud, network infrastructure",
    light: "border-teal-200 bg-white",
    dark: "dark:border-teal-900 dark:bg-[#1a1828]",
    activeLight: "border-teal-400 bg-teal-50/60",
    activeDark: "dark:border-teal-600 dark:bg-teal-950/40",
    badge: "bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
    topics: [
      { name: "Data Protection",                  courseSection: 7  },
      { name: "Cyber Resilience and Redundancy",  courseSection: 14 },
      { name: "Security Architecture",            courseSection: 15 },
      { name: "Security Infrastructure",          courseSection: 16 },
    ],
  },
  {
    id: 4,
    label: "Domain 4",
    title: "Security Operations",
    description: "IAM, vulnerability mgmt, SIEM, incident response, automation",
    light: "border-violet-200 bg-white",
    dark: "dark:border-violet-900 dark:bg-[#1a1828]",
    activeLight: "border-violet-400 bg-violet-50/60",
    activeDark: "dark:border-violet-600 dark:bg-violet-950/40",
    badge: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    topics: [
      { name: "Asset and Change Management",  courseSection: 12 },
      { name: "Identity and Access Management", courseSection: 17 },
      { name: "Security Techniques",          courseSection: 21 },
      { name: "Vulnerability Management",     courseSection: 22 },
      { name: "Alerting and Monitoring",      courseSection: 23 },
      { name: "Incident Response",            courseSection: 24 },
      { name: "Investigating an Incident",    courseSection: 25 },
      { name: "Automation and Orchestration", courseSection: 26 },
    ],
  },
  {
    id: 5,
    label: "Domain 5",
    title: "Security Program Management",
    description: "Risk, third-party vendors, governance, audits, awareness",
    light: "border-amber-200 bg-white",
    dark: "dark:border-amber-900 dark:bg-[#1a1828]",
    activeLight: "border-amber-400 bg-amber-50/60",
    activeDark: "dark:border-amber-600 dark:bg-amber-950/40",
    badge: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    topics: [
      { name: "Risk Management",          courseSection: 9  },
      { name: "Third-party Vendor Risks", courseSection: 10 },
      { name: "Governance and Compliance", courseSection: 11 },
      { name: "Audits and Assessments",   courseSection: 13 },
      { name: "Security Awareness",       courseSection: 27 },
    ],
  },
]

type Block = typeof BLOCKS[number]

export default function BlockSelector() {
  const router = useRouter()
  const { userId } = useAuth()
  const { navigatingTo, startNavigation, endNavigation } = useUIStore()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [topicStats, setTopicStats] = useState<Map<string, TopicStats>>(new Map())
  const [sortOrder, setSortOrder] = useState<"exam" | "course">("exam")

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

  function topicScore(topic: string): { label: string; cls: string } | null {
    const s = topicStats.get(topic)
    if (!s || s.total_answers === 0 || !s.best_score) return null
    const pct = Math.round(s.best_score * 100)
    const cls =
      pct >= 80
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
        : pct >= 60
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
        : "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300"
    return { label: `${pct}%`, cls }
  }

  function startQuiz(blockId: number, topic?: string) {
    const key = topic ? `${blockId}:${topic}` : `${blockId}:all`
    if (navigatingTo) return
    startNavigation(key)
    router.push(topic ? `/quiz/${blockId}?topic=${encodeURIComponent(topic)}` : `/quiz/${blockId}`)
  }

  // ── Shared render helpers (called as functions, not <Components />) ─────────

  function renderTopicList(block: Block) {
    const allKey = `${block.id}:all`
    const isAllLoading = navigatingTo === allKey

    const sortedTopics = block.topics

    return (
      <div className="mt-2 flex flex-col gap-1.5 pl-2">
        {/* All topics shortcut */}
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
          {isAllLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <HiPlayCircle className="text-base text-zinc-400 dark:text-zinc-500" />
          )}
        </motion.button>

        {/* Individual topics */}
        {sortedTopics.map((topic, ti) => {
          const weak = isWeak(topic.name)
          const strong = isStrong(topic.name)
          const score = topicScore(topic.name)
          const topicKey = `${block.id}:${topic.name}`
          const isLoading = navigatingTo === topicKey
          return (
            <motion.button
              key={topic.name}
              onClick={() => startQuiz(block.id, topic.name)}
              disabled={!!navigatingTo}
              className="flex items-center justify-between w-full bg-white dark:bg-[#1a1828] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-left group disabled:opacity-60"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: ti * 0.03 }}
              whileHover={navigatingTo ? {} : { x: 2 }}
              whileTap={navigatingTo ? {} : { scale: 0.97 }}
            >
              <div className="flex items-center gap-2 min-w-0">
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
                  {topic.name}
                </span>
                {score && (
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${score.cls}`}>
                    {score.label}
                  </span>
                )}
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
    )
  }

  function renderBlock(block: Block, index: number, forceExpanded: boolean) {
    const isOpen = forceExpanded || expanded === block.id
    const weakCount = block.topics.filter((t) => isWeak(t.name)).length

    const headerInner = (
      <>
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
      </>
    )

    return (
      <motion.div
        key={block.id}
        data-onboarding={index === 0 ? "block-first" : undefined}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
      >
        {/* Block header — static div on desktop, interactive button on mobile */}
        {forceExpanded ? (
          <div className={`w-full border-2 rounded-2xl p-4 shadow-sm ${block.activeLight} ${block.activeDark}`}>
            {headerInner}
          </div>
        ) : (
          <motion.button
            onClick={() => setExpanded(isOpen ? null : block.id)}
            className={`w-full flex items-center justify-between border-2 rounded-2xl p-4 transition-colors duration-200 shadow-sm text-left
              ${isOpen ? `${block.activeLight} ${block.activeDark}` : `${block.light} ${block.dark}`}`}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="flex-1 min-w-0">{headerInner}</div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 shrink-0"
            >
              <HiChevronDown className="text-zinc-300 dark:text-zinc-600 text-xl" />
            </motion.div>
          </motion.button>
        )}

        {/* Topic list */}
        {forceExpanded ? (
          renderTopicList(block)
        ) : (
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden px-1 -mx-1"
              >
                {renderTopicList(block)}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    )
  }

  function renderCourseList() {
    const allTopics = BLOCKS.flatMap((block) =>
      block.topics.map((topic) => ({ ...topic, block }))
    ).sort((a, b) => a.courseSection - b.courseSection)

    return (
      <div className="flex flex-col gap-1.5">
        {allTopics.map((topic, ti) => {
          const weak = isWeak(topic.name)
          const strong = isStrong(topic.name)
          const score = topicScore(topic.name)
          const topicKey = `${topic.block.id}:${topic.name}`
          const isLoading = navigatingTo === topicKey
          return (
            <motion.button
              key={topicKey}
              onClick={() => startQuiz(topic.block.id, topic.name)}
              disabled={!!navigatingTo}
              className="flex items-center justify-between w-full bg-white dark:bg-[#1a1828] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-left group disabled:opacity-60"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: ti * 0.02 }}
              whileHover={navigatingTo ? {} : { x: 2 }}
              whileTap={navigatingTo ? {} : { scale: 0.97 }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-600 w-5 text-right">
                  §{topic.courseSection}
                </span>
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
                  {topic.name}
                </span>
                <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${topic.block.badge}`}>
                  {topic.block.label}
                </span>
                {score && (
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${score.cls}`}>
                    {score.label}
                  </span>
                )}
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
    )
  }

  function renderMixed(delayIndex: number) {
    const mixedKey = "mixed"
    const isLoading = navigatingTo === mixedKey
    return (
      <motion.button
        key="mixed"
        data-onboarding="mixed-quiz"
        onClick={() => {
          if (navigatingTo) return
          startNavigation(mixedKey)
          router.push("/quiz/all")
        }}
        disabled={!!navigatingTo}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: delayIndex * 0.06 }}
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
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Questions from all domains</p>
        </div>
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0 ml-3" />
        ) : (
          <HiChevronRight className="text-zinc-300 dark:text-zinc-600 text-xl shrink-0 ml-3" />
        )}
      </motion.button>
    )
  }

  // ── Single-column collapsible (all viewports) ─────────────────────────────
  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      {/* Sort order toggle */}
      <div className="flex items-center justify-end gap-1 text-xs text-zinc-400 dark:text-zinc-500">
        <span className="mr-1">Order:</span>
        <button
          onClick={() => setSortOrder("exam")}
          className={`px-2 py-0.5 rounded-md transition-colors ${
            sortOrder === "exam"
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold"
              : "hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Exam
        </button>
        <button
          onClick={() => setSortOrder("course")}
          className={`px-2 py-0.5 rounded-md transition-colors ${
            sortOrder === "course"
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold"
              : "hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Course
        </button>
      </div>

      {sortOrder === "course" ? (
        <div data-onboarding="block-list">
          {renderCourseList()}
          {renderMixed(0)}
        </div>
      ) : (
        <motion.div
          data-onboarding="block-list"
          className="flex flex-col gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {BLOCKS.map((block, i) => renderBlock(block, i, false))}
          {renderMixed(BLOCKS.length)}
        </motion.div>
      )}
    </div>
  )
}
