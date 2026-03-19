"use client"

import { motion } from "motion/react"
import type { Question } from "@/lib/types"

interface Props {
  question: Question
  selectedAnswer: number | null
  showFeedback: boolean
  onSelect: (index: number) => void
}

const optionLetters = ["A", "B", "C", "D"]

export default function QuizCard({ question, selectedAnswer, showFeedback, onSelect }: Props) {
  return (
    <div className="w-full bg-white dark:bg-[#1a1828] rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2d2a40] p-5 mb-3">
      <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3">
        Block {question.block} · {question.topic}
      </p>
      <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-5 leading-relaxed">
        {question.question}
      </p>

      <div className="flex flex-col gap-2.5">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = index === question.correct_index
          const isWrong = showFeedback && isSelected && !isCorrect

          let bg = "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
          if (!showFeedback && isSelected) {
            bg = "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-500 text-indigo-800 dark:text-indigo-200"
          } else if (showFeedback && isCorrect) {
            bg = "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200"
          } else if (isWrong) {
            bg = "bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300"
          } else if (showFeedback) {
            bg = "bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600"
          }

          return (
            <motion.button
              key={index}
              className={`border-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors duration-150 w-full ${bg}`}
              onClick={() => !showFeedback && onSelect(index)}
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
      </div>
    </div>
  )
}
