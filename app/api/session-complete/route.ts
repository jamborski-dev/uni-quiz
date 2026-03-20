import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { SessionAnswer } from "@/lib/types"

interface SessionCompleteBody {
  user_id: string
  block: number | string
  answers: SessionAnswer[]
}

// Recency-weighted weakness score:
// Recent wrong answers count more heavily than older ones.
function computeWeaknessScore(recentAnswers: { isCorrect: boolean }[]): number {
  if (recentAnswers.length === 0) return 0.5
  let weightedWrong = 0
  let totalWeight = 0
  recentAnswers.forEach((a, i) => {
    // More recent = higher index = higher weight
    const weight = i + 1
    totalWeight += weight
    if (!a.isCorrect) weightedWrong += weight
  })
  return totalWeight > 0 ? weightedWrong / totalWeight : 0.5
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionCompleteBody = await request.json()
    const { user_id, answers } = body

    if (!user_id || !answers?.length) {
      return NextResponse.json({ ok: true, stats: [] })
    }

    // Verify profile exists
    const profile = await prisma.profile.findUnique({ where: { id: user_id } })
    if (!profile) {
      console.error("session-complete: profile not found for user_id", user_id)
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 })
    }

    // Group answers by topic first (before inserting, so prevAnswers won't include current session)
    const topicGroups = new Map<string, SessionAnswer[]>()
    for (const a of answers) {
      const existing = topicGroups.get(a.topic) ?? []
      existing.push(a)
      topicGroups.set(a.topic, existing)
    }

    // Load previous answers per topic BEFORE inserting current session
    const prevAnswersByTopic = new Map<string, { isCorrect: boolean }[]>()
    for (const [topic] of topicGroups) {
      const prev = await prisma.answerLog.findMany({
        where: { user_id, topic },
        orderBy: { answered_at: "asc" },
        take: 50,
      })
      prevAnswersByTopic.set(topic, prev.map((a) => ({ isCorrect: a.is_correct })))
    }

    // Insert all answer logs
    for (const answer of answers) {
      if (!answer.questionId) continue
      try {
        await prisma.answerLog.create({
          data: {
            question_id: answer.questionId,
            block: answer.block,
            topic: answer.topic,
            is_correct: answer.isCorrect,
            user_id,
          },
        })
      } catch {
        // Skip if question ID is not in DB
      }
    }

    const updatedStats = []
    for (const [topic, topicAnswers] of topicGroups) {
      const block = topicAnswers[0].block
      const correctCount = topicAnswers.filter((a) => a.isCorrect).length

      const allAnswers = [
        ...(prevAnswersByTopic.get(topic) ?? []),
        ...topicAnswers.map((a) => ({ isCorrect: a.isCorrect })),
      ]

      const weakness_score = computeWeaknessScore(allAnswers)

      const existing = await prisma.topicStats.findUnique({
        where: { topic_user_id: { topic, user_id } },
      })

      if (existing) {
        const updated = await prisma.topicStats.update({
          where: { topic_user_id: { topic, user_id } },
          data: {
            total_answers: { increment: topicAnswers.length },
            correct: { increment: correctCount },
            last_seen: new Date(),
            weakness_score,
          },
        })
        updatedStats.push(updated)
      } else {
        const created = await prisma.topicStats.create({
          data: {
            topic,
            block,
            total_answers: topicAnswers.length,
            correct: correctCount,
            last_seen: new Date(),
            weakness_score,
            user_id,
          },
        })
        updatedStats.push(created)
      }
    }

    return NextResponse.json({ ok: true, stats: updatedStats })
  } catch (error) {
    console.error("Session complete error:", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
