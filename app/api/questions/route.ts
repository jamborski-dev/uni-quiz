import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { SEED_QUESTIONS } from "@/data/questions"
import type { Block } from "@/lib/types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const blockParam = searchParams.get("block")
  const topicParam = searchParams.get("topic")
  const topicsParam = searchParams.get("topics") // comma-separated list

  const block =
    blockParam && blockParam !== "all" ? (Number(blockParam) as Block) : null

  const topicList = topicsParam
    ? topicsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : null

  try {
    const where: Record<string, unknown> = {}
    if (block) where.block = block
    if (topicParam) where.topic = topicParam
    if (topicList?.length) where.topic = { in: topicList }

    const data = await prisma.question.findMany({
      where,
      orderBy: { created_at: "desc" },
    })

    if (data.length > 0) {
      const shuffled = [...data].sort(() => Math.random() - 0.5)
      return NextResponse.json({ questions: shuffled })
    }
  } catch {
    // DB not configured - fall through to seed data
  }

  // Fallback: hardcoded seed questions
  let filtered = SEED_QUESTIONS as typeof SEED_QUESTIONS
  if (block) filtered = filtered.filter((q) => q.block === block)
  if (topicParam) filtered = filtered.filter((q) => q.topic === topicParam)
  if (topicList?.length) filtered = filtered.filter((q) => topicList.includes(q.topic))

  const shuffled = [...filtered].sort(() => Math.random() - 0.5)
  return NextResponse.json({ questions: shuffled })
}

// POST is now deprecated in favour of /api/session-complete
// Kept for backwards compatibility with the quiz hook's fire-and-forget logging
export async function POST(request: NextRequest) {
  // No-op - answer logging is handled by /api/session-complete
  return NextResponse.json({ ok: true })
}
