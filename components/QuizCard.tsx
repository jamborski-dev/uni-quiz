"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HiArrowRight } from "react-icons/hi2"
import type { Question } from "@/lib/types"

interface Props {
  question: Question
  selectedAnswer: number | null
  showFeedback: boolean
  isEvaluating?: boolean
  onSelect: (index: number) => void
  onSubmitOpenAnswer?: (text: string) => void
}

const optionLetters = ["A", "B", "C", "D"]

export default function QuizCard({
  question,
  selectedAnswer,
  showFeedback,
  isEvaluating,
  onSelect,
  onSubmitOpenAnswer,
}: Props) {
  const [localText, setLocalText] = useState("")
  const [pendingAnswer, setPendingAnswer] = useState<number | null>(null)
  const isOpenAnswer = question.type === "open-answer"

  // Reset local state when question changes
  useEffect(() => {
    setLocalText("")
    setPendingAnswer(null)
  }, [question.id])

  function handleSubmit() {
    if (!localText.trim() || isEvaluating || showFeedback) return
    onSubmitOpenAnswer?.(localText.trim())
  }

  return (
    <div className="w-full bg-white dark:bg-[#1a1828] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2d2a40] p-5 mb-3">
      <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-5 leading-relaxed">
        {question.question}
      </p>

      {isOpenAnswer ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            disabled={showFeedback || isEvaluating}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-100 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 p-3 resize-none focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors disabled:opacity-60"
          />
          {!showFeedback && (
            <motion.button
              onClick={handleSubmit}
              disabled={!localText.trim() || isEvaluating}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isEvaluating && !!localText.trim() ? { scale: 1.02 } : {}}
              whileTap={!isEvaluating && !!localText.trim() ? { scale: 0.97 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {isEvaluating ? (
                <>
                  <motion.div
                    className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Evaluating...
                </>
              ) : (
                <>
                  Submit answer
                  <HiArrowRight className="text-base" />
                </>
              )}
            </motion.button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {question.options.map((option, index) => {
            const isPending = !showFeedback && pendingAnswer === index
            const isSelected = selectedAnswer === index
            const isCorrect = index === question.correct_index
            const isWrong = showFeedback && isSelected && !isCorrect

            let bg =
              "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
            if (isPending) {
              bg =
                "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-500 text-indigo-800 dark:text-indigo-200"
            } else if (showFeedback && isCorrect) {
              bg =
                "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200"
            } else if (isWrong) {
              bg =
                "bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300"
            } else if (showFeedback) {
              bg =
                "bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600"
            }

            return (
              <motion.button
                key={index}
                className={`border-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors duration-150 w-full ${bg}`}
                onClick={() => !showFeedback && setPendingAnswer(index)}
                disabled={showFeedback}
                whileHover={!showFeedback ? { scale: 1.01 } : {}}
                whileTap={!showFeedback ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <span className="mr-2.5 font-bold text-xs opacity-50">{optionLetters[index]}.</span>
                {option}
              </motion.button>
            )
          })}

          {!showFeedback && pendingAnswer !== null && (
            <motion.button
              onClick={() => onSelect(pendingAnswer)}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm mt-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Confirm answer
              <HiArrowRight className="text-base" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
}
