"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HiArrowLeft } from "react-icons/hi2"
import Link from "next/link"
import { useQuiz } from "@/hooks/useQuiz"
import { useAuth } from "@/hooks/useAuth"
import QuizCard from "@/components/QuizCard"
import FeedbackPanel from "@/components/FeedbackPanel"
import type { Block } from "@/lib/types"

function QuizContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userId, profile } = useAuth()

  const rawBlock = params.block as string
  const block = rawBlock === "all" ? "all" : (Number(rawBlock) as Block)
  const topic = searchParams.get("topic") ?? undefined
  const topicsParam = searchParams.get("topics")
  const topics = topicsParam ? topicsParam.split(",").map((t) => t.trim()) : undefined

  const {
    session,
    loading,
    error,
    selectedAnswer,
    showFeedback,
    isEvaluating,
    currentEvaluation,
    selectAnswer,
    submitOpenAnswer,
    nextQuestion,
  } = useQuiz(block, {
    topic,
    topics,
    userId: userId ?? undefined,
    strictness: profile?.quiz_strictness as "lenient" | "balanced" | "strict" | undefined,
  })

  useEffect(() => {
    if (session && session.current_index >= session.questions.length) {
      router.push(
        `/results?score=${session.score}&total=${session.questions.length}&block=${session.block}`
      )
    }
  }, [session, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.p
          className="text-zinc-400 dark:text-zinc-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading questions...
        </motion.p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-5">
        <p className="text-red-500 text-sm">Error: {error}</p>
        <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline text-sm">
          Back to home
        </Link>
      </main>
    )
  }

  if (!session || session.questions.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-5">
        <p className="text-zinc-400 text-sm">No questions found for this selection.</p>
        <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline text-sm">
          Back to home
        </Link>
      </main>
    )
  }

  const currentQuestion = session.questions[session.current_index]
  const progress = session.current_index / session.questions.length

  if (!currentQuestion) return null

  return (
    <main className="min-h-screen flex flex-col items-center p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between mt-4 mb-3">
        <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.92 }}>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            <HiArrowLeft className="text-base" />
            Exit
          </Link>
        </motion.div>
        <span className="text-sm text-zinc-400 dark:text-zinc-500">
          {session.current_index + 1} / {session.questions.length}
        </span>
        <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-400">
          {session.score} pts
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mb-5">
        <motion.div
          className="bg-indigo-500 dark:bg-indigo-400 h-1.5 rounded-full"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Topic label */}
      <div className="w-full mb-3">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1">
          Block {currentQuestion.block} · {currentQuestion.topic}
        </span>
      </div>

      {/* Animated question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={session.current_index}
          className="w-full"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <QuizCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            showFeedback={showFeedback}
            isEvaluating={isEvaluating}
            onSelect={selectAnswer}
            onSubmitOpenAnswer={submitOpenAnswer}
          />

          <AnimatePresence>
            {showFeedback && (
              <FeedbackPanel
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                evaluation={currentEvaluation ?? undefined}
                onNext={nextQuestion}
                isLast={session.current_index === session.questions.length - 1}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </main>
  )
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">Loading...</p>
        </main>
      }
    >
      <QuizContent />
    </Suspense>
  )
}
