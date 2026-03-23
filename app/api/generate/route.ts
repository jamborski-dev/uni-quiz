import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { anthropic } from "@/lib/anthropic"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const MIN_ACCURACY = 0.9
const QUESTIONS_TO_GENERATE = 10

const BLOCK_TOPICS: Record<number, string[]> = {
  1: ["Living in a digital world", "The evolving computer", "Digital media", "A world built of data", "Weaving the web", "Crossing boundaries - HCI and design"],
  2: ["Programming with Scratch - sequences and sprites", "Numbers, strings and lists", "Selection and Booleans", "Loops", "Nested structures and modularity", "Algorithms and sorting"],
  3: ["Network technologies", "The internet", "Wireless communications", "The Internet of Things", "Online communication", "The networked society"],
  4: ["Percentages", "Exponent notation", "Scientific notation", "Binary and number systems", "Equations and substitution", "Inverse square law"],
}

const BLOCK_NAMES: Record<number, string> = {
  1: "The Digital World",
  2: "Creating Solutions",
  3: "Connecting People",
  4: "Using Numbers (Maths)",
}

/** GET /api/generate?user_id=X — return latest generation per block */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  if (!userId) return NextResponse.json({ generations: [] })

  try {
    // Get the most recent generation per block for this user
    const rows = await prisma.questionGeneration.findMany({
      where: { user_id: userId },
      orderBy: { generated_at: "desc" },
    })

    // Deduplicate: keep only the latest per block
    const seen = new Set<number>()
    // Deduplicate per (block, topic) pair — keep only latest
    const seenKeys = new Set<string>()
    const generations = rows
      .filter((r) => {
        const key = `${r.block}:${r.topic ?? "all"}`
        if (seenKeys.has(key)) return false
        seenKeys.add(key)
        return true
      })
      .map((r) => ({
        block: r.block,
        topic: r.topic ?? null,
        generated_at: r.generated_at.toISOString(),
        count: r.count,
      }))

    return NextResponse.json({ generations })
  } catch {
    return NextResponse.json({ generations: [] })
  }
}

/** POST /api/generate — generate new questions for a block */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { block, topic, user_id } = body as {
      block: number
      topic?: string
      user_id: string
    }

    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 })
    if (!block || block < 1 || block > 4) {
      return NextResponse.json({ error: "block must be 1–4" }, { status: 400 })
    }

    // 1. Check block accuracy
    const stats = await prisma.topicStats.findMany({
      where: { user_id, block },
    })

    const totalAnswered = stats.reduce((s, t) => s + t.total_answers, 0)
    if (totalAnswered === 0) {
      return NextResponse.json(
        { error: "No answers recorded for this block yet. Complete some questions first." },
        { status: 422 }
      )
    }

    const totalCorrect = stats.reduce((s, t) => s + t.correct, 0)
    const accuracy = totalCorrect / totalAnswered
    if (accuracy < MIN_ACCURACY) {
      return NextResponse.json(
        { error: `Block accuracy is ${Math.round(accuracy * 100)}%. Reach 90% to unlock generation.` },
        { status: 422 }
      )
    }

    // 2. Check 7-day cooldown — scoped to (block, topic) pair
    const lastGen = await prisma.questionGeneration.findFirst({
      where: { user_id, block, topic: topic ?? null },
      orderBy: { generated_at: "desc" },
    })

    if (lastGen) {
      const msSince = Date.now() - lastGen.generated_at.getTime()
      if (msSince < SEVEN_DAYS_MS) {
        const nextAvailableAt = new Date(lastGen.generated_at.getTime() + SEVEN_DAYS_MS).toISOString()
        return NextResponse.json(
          { error: "Questions were recently generated for this block.", next_available_at: nextAvailableAt },
          { status: 429 }
        )
      }
    }

    // 3. Build prompt
    const topicContext = topic
      ? `, focusing on the topic: "${topic}"`
      : `. Cover a variety of these topics: ${BLOCK_TOPICS[block]?.join(", ")}`

    const systemPrompt = `You are an expert question writer for the Open University TM111 module (Introduction to Computing and IT), specifically Block ${block}: ${BLOCK_NAMES[block]}.

Generate exactly ${QUESTIONS_TO_GENERATE} quiz questions.

Rules:
- Never use em dashes. Use hyphens instead.
- Return ONLY a valid JSON array with no markdown, no code fences, no text outside the array.
- Each element must have exactly these fields:
  "block" (integer ${block}),
  "topic" (string - the specific topic name from the TM111 syllabus),
  "type" ("multiple-choice" or "true-false"),
  "question" (string),
  "options" (array - 4 strings for multiple-choice, ["True","False"] for true-false),
  "correct_index" (0-based integer),
  "explanation" (string, 2-3 sentences explaining why the answer is correct),
  "topic_summary" (string, 1 sentence summarising the topic context),
  "further_reading" (empty array [])
- Test genuine conceptual understanding, not trivial recall.
- Vary difficulty: mix straightforward, moderate, and challenging questions.
- Ensure all distractors in multiple-choice are plausible.`

    const userPrompt = `Generate ${QUESTIONS_TO_GENERATE} questions for TM111 Block ${block}: ${BLOCK_NAMES[block]}${topicContext}.`

    // 4. Call Claude
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : ""

    // Strip markdown fences if present
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()

    let generated: unknown[]
    try {
      generated = JSON.parse(jsonText)
      if (!Array.isArray(generated)) throw new Error("Not an array")
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 })
    }

    // 5. Validate and prepare questions
    const valid = generated.filter((q): q is Record<string, unknown> => {
      if (typeof q !== "object" || q === null) return false
      const obj = q as Record<string, unknown>
      return (
        typeof obj.block === "number" &&
        typeof obj.topic === "string" &&
        typeof obj.type === "string" &&
        ["multiple-choice", "true-false"].includes(obj.type as string) &&
        typeof obj.question === "string" &&
        Array.isArray(obj.options) &&
        typeof obj.correct_index === "number" &&
        typeof obj.explanation === "string"
      )
    })

    if (valid.length === 0) {
      return NextResponse.json({ error: "No valid questions in AI response" }, { status: 502 })
    }

    const questionsToSave = valid.map((q) => ({
      block: Number(q.block),
      topic: String(q.topic),
      type: String(q.type),
      question: String(q.question),
      options: q.options as string[],
      correct_index: Number(q.correct_index),
      explanation: String(q.explanation),
      topic_summary: typeof q.topic_summary === "string" ? q.topic_summary : "",
      further_reading: [],
      source: "ai-generated",
    }))

    // 6. Save to DB
    await prisma.question.createMany({ data: questionsToSave })

    // 7. Record generation
    await prisma.questionGeneration.create({
      data: { user_id, block, topic: topic ?? null, count: questionsToSave.length },
    })

    // 8. Create notification
    const blockLabel = block === 4 ? "Maths" : `Block ${block}`
    await prisma.notification.create({
      data: {
        user_id,
        title: "New questions generated",
        message: `${questionsToSave.length} new ${blockLabel} questions have been added to your pool.`,
        type: "success",
      },
    })

    return NextResponse.json({ success: true, count: questionsToSave.length })
  } catch (err) {
    console.error("[api/generate] error:", err)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}
