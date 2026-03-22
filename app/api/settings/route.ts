import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { StrictnessLevel, QuestionMode } from "@/lib/types"

const VALID_STRICTNESS: StrictnessLevel[] = ["lenient", "balanced", "strict"]
const VALID_MODES: QuestionMode[] = ["mixed", "new_only", "weak_first", "spaced_repetition", "mastery"]

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, quiz_strictness, question_mode } = body as {
      user_id: string
      quiz_strictness?: string
      question_mode?: string
    }

    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 })

    if (quiz_strictness && !VALID_STRICTNESS.includes(quiz_strictness as StrictnessLevel)) {
      return NextResponse.json({ error: "Invalid quiz_strictness value" }, { status: 400 })
    }
    if (question_mode && !VALID_MODES.includes(question_mode as QuestionMode)) {
      return NextResponse.json({ error: "Invalid question_mode value" }, { status: 400 })
    }

    const data: Record<string, string> = {}
    if (quiz_strictness) data.quiz_strictness = quiz_strictness
    if (question_mode) data.question_mode = question_mode

    const profile = await prisma.profile.update({
      where: { id: user_id },
      data,
    })

    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
