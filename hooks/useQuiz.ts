"use client"

import { useState, useEffect, useCallback } from "react"
import { checkAnthropicCredits } from "@/lib/credits"
import type {
  QuizSession,
  Block,
  Question,
  EvaluationResult,
  SessionResult,
  SessionAnswer,
  StrictnessLevel,
} from "@/lib/types"

const SESSION_STORAGE_KEY = "quiz_session_result"

interface OpenAnswerResult {
  text: string
  evaluation: EvaluationResult
}

export function useQuiz(
  block: Block | "all",
  options?: { topic?: string; topics?: string[]; userId?: string; strictness?: StrictnessLevel }
) {
  const [session, setSession] = useState<QuizSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [openAnswerResults, setOpenAnswerResults] = useState<(OpenAnswerResult | null)[]>([])
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null)
  const [openAnswersEnabled, setOpenAnswersEnabled] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      setError(null)
      try {
        const param = block === "all" ? "all" : String(block)
        let url = `/api/questions?block=${param}`
        if (options?.topic) url += `&topic=${encodeURIComponent(options.topic)}`
        if (options?.topics?.length) url += `&topics=${options.topics.map(encodeURIComponent).join(",")}`

        const [res, creditsAvailable] = await Promise.all([
          fetch(url),
          checkAnthropicCredits(),
        ])

        if (!res.ok) throw new Error(`Failed to fetch questions (${res.status})`)
        const { questions } = (await res.json()) as { questions: Question[] }

        setOpenAnswersEnabled(creditsAvailable)

        const filtered = creditsAvailable
          ? questions
          : questions.filter((q) => q.type !== "open-answer")

        setSession({
          block,
          topic: options?.topic,
          questions: filtered,
          current_index: 0,
          answers: new Array(filtered.length).fill(null),
          open_answers: new Array(filtered.length).fill(null),
          score: 0,
        })
        setOpenAnswerResults(new Array(filtered.length).fill(null))
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [block, options?.topic, options?.topics?.join(",")])

  // Select answer for MC / true-false questions
  const selectAnswer = useCallback(
    (index: number) => {
      if (!session || showFeedback) return

      setSelectedAnswer(index)
      setShowFeedback(true)
      setCurrentEvaluation(null)

      const question = session.questions[session.current_index]
      const isCorrect = index === question.correct_index

      setSession((prev) => {
        if (!prev) return prev
        const newAnswers = [...prev.answers]
        newAnswers[prev.current_index] = index
        return {
          ...prev,
          answers: newAnswers,
          score: isCorrect ? prev.score + 1 : prev.score,
        }
      })
    },
    [session, showFeedback]
  )

  // Submit open-answer question for AI evaluation
  const submitOpenAnswer = useCallback(
    async (text: string) => {
      if (!session || showFeedback || isEvaluating) return

      const question = session.questions[session.current_index]
      setIsEvaluating(true)

      try {
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.question,
            correct_answer: question.explanation,
            user_answer: text,
            strictness: options?.strictness ?? "balanced",
          }),
        })

        const evaluation: EvaluationResult = await res.json()
        setCurrentEvaluation(evaluation)

        setOpenAnswerResults((prev) => {
          const next = [...prev]
          next[session.current_index] = { text, evaluation }
          return next
        })

        setSession((prev) => {
          if (!prev) return prev
          const newOpenAnswers = [...prev.open_answers]
          newOpenAnswers[prev.current_index] = text
          return {
            ...prev,
            open_answers: newOpenAnswers,
            score: evaluation.is_correct ? prev.score + 1 : prev.score,
          }
        })

        setSelectedAnswer(-1)
        setShowFeedback(true)
      } catch {
        setIsEvaluating(false)
      } finally {
        setIsEvaluating(false)
      }
    },
    [session, showFeedback, isEvaluating, options?.strictness]
  )

  // Save completed session to sessionStorage for results page
  const saveSessionResult = useCallback(
    (finalSession: QuizSession) => {
      const sessionAnswers: SessionAnswer[] = finalSession.questions.map((q, i) => {
        const isOpenAnswer = q.type === "open-answer"
        const openResult = openAnswerResults[i]
        const selectedIndex = finalSession.answers[i]

        let isCorrect: boolean
        if (isOpenAnswer) {
          isCorrect = openResult?.evaluation.is_correct ?? false
        } else {
          isCorrect = selectedIndex === q.correct_index
        }

        return {
          questionId: q.id,
          questionText: q.question,
          topic: q.topic,
          block: q.block,
          isCorrect,
          selectedIndex: isOpenAnswer ? null : selectedIndex,
          openText: isOpenAnswer ? (openResult?.text ?? null) : null,
          aiFeedback: isOpenAnswer ? openResult?.evaluation.feedback : undefined,
          topicSummary: q.topic_summary ?? "",
          furtherReading: q.further_reading ?? [],
        }
      })

      const result: SessionResult = {
        block: finalSession.block,
        topic: finalSession.topic,
        score: finalSession.score,
        total: finalSession.questions.length,
        answers: sessionAnswers,
      }

      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result))
      } catch {
        // sessionStorage not available (e.g. private browsing with storage blocked)
      }

      return result
    },
    [openAnswerResults]
  )

  const nextQuestion = useCallback(() => {
    setShowFeedback(false)
    setSelectedAnswer(null)
    setCurrentEvaluation(null)
    setSession((prev) => {
      if (!prev) return prev
      const next = { ...prev, current_index: prev.current_index + 1 }
      if (next.current_index >= prev.questions.length) {
        saveSessionResult(prev)
      }
      return next
    })
  }, [saveSessionResult])

  return {
    session,
    loading,
    error,
    selectedAnswer,
    showFeedback,
    isEvaluating,
    currentEvaluation,
    openAnswersEnabled,
    selectAnswer,
    submitOpenAnswer,
    nextQuestion,
  }
}
