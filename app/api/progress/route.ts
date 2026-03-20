import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")

  // Get question counts per topic
  const questionCounts = await prisma.question.groupBy({
    by: ["block", "topic"],
    _count: { id: true },
  })

  // Get user stats if logged in
  let statsMap = new Map<string, { total_answers: number; correct: number; weakness_score: number }>()
  if (userId) {
    const stats = await prisma.topicStats.findMany({ where: { user_id: userId } })
    for (const s of stats) {
      statsMap.set(s.topic, {
        total_answers: s.total_answers,
        correct: s.correct,
        weakness_score: s.weakness_score,
      })
    }
  }

  const topics = questionCounts.map((row) => ({
    block: row.block,
    topic: row.topic,
    total_questions: row._count.id,
    ...(statsMap.get(row.topic) ?? { total_answers: 0, correct: 0, weakness_score: 0.5 }),
  }))

  // Sort by block then topic
  topics.sort((a, b) => a.block - b.block || a.topic.localeCompare(b.topic))

  return NextResponse.json({ topics })
}
