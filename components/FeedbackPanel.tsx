"use client"

import { motion } from "motion/react"
import { HiCheckCircle, HiXCircle, HiArrowRight } from "react-icons/hi2"
import type { Question, EvaluationResult } from "@/lib/types"
import MarkdownText from "@/components/MarkdownText"

interface Props {
  question: Question
  selectedAnswer: number | null   // null for open-answer
  evaluation?: EvaluationResult   // present for open-answer questions
  onNext: () => void
  isLast: boolean
}

export default function FeedbackPanel({ question, selectedAnswer, evaluation, onNext, isLast }: Props) {
  const isOpenAnswer = question.type === "open-answer"

  // Determine correctness
  const isCorrect = isOpenAnswer
    ? (evaluation?.is_correct ?? false)
    : selectedAnswer === question.correct_index

  // Determine header message
  let headerText: string
  if (isOpenAnswer) {
    headerText = isCorrect ? "Well done!" : "Not quite right"
  } else {
    headerText = isCorrect
      ? "Correct!"
      : `Incorrect - the answer was "${question.options[question.correct_index]}"`
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="bg-white dark:bg-[#1a1828] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2d2a40] p-5 mb-3">
        <div
          className={`flex items-start gap-2.5 mb-3 ${
            isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {isCorrect
            ? <HiCheckCircle className="text-xl shrink-0 mt-0.5" />
            : <HiXCircle className="text-xl shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold leading-snug">{headerText}</span>
        </div>

        {/* AI feedback for open-answer questions */}
        {isOpenAnswer && evaluation?.feedback && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3 font-medium">
            {evaluation.feedback}
          </p>
        )}

        {/* Standard explanation */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <MarkdownText>{question.explanation}</MarkdownText>
        </p>
      </div>

      <motion.button
        onClick={onNext}
        className="w-full bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
        whileHover={{ scale: 1.02, backgroundColor: "#4338ca" }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {isLast ? "See Results" : "Next Question"}
        <HiArrowRight className="text-base" />
      </motion.button>
    </motion.div>
  )
}
