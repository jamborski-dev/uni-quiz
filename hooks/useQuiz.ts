"use client";

import { useState, useEffect, useCallback } from "react";
import type { QuizSession, Block, Question } from "@/lib/types";

export function useQuiz(block: Block | "all") {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const param = block === "all" ? "all" : String(block);
        const res = await fetch(`/api/questions?block=${param}`);
        if (!res.ok) throw new Error(`Failed to fetch questions (${res.status})`);
        const { questions } = (await res.json()) as { questions: Question[] };

        setSession({
          block,
          questions,
          current_index: 0,
          answers: new Array(questions.length).fill(null),
          score: 0,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [block]);

  const selectAnswer = useCallback(
    (index: number) => {
      if (!session || showFeedback) return;

      setSelectedAnswer(index);
      setShowFeedback(true);

      const question = session.questions[session.current_index];
      const isCorrect = index === question.correct_index;

      // Log answer (fire-and-forget)
      fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          block: question.block,
          topic: question.topic,
          is_correct: isCorrect,
        }),
      }).catch(() => {/* ignore logging errors */});

      setSession((prev) => {
        if (!prev) return prev;
        const newAnswers = [...prev.answers];
        newAnswers[prev.current_index] = index;
        return {
          ...prev,
          answers: newAnswers,
          score: isCorrect ? prev.score + 1 : prev.score,
        };
      });
    },
    [session, showFeedback]
  );

  const nextQuestion = useCallback(() => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, current_index: prev.current_index + 1 };
    });
  }, []);

  return { session, loading, error, selectedAnswer, showFeedback, selectAnswer, nextQuestion };
}
