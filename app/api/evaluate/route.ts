import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { StrictnessLevel, EvaluationResult } from "@/lib/types"

const client = new Anthropic()

const STRICTNESS_INSTRUCTIONS: Record<StrictnessLevel, string> = {
  lenient: `You reward effort and accept partial answers generously. A student gets credit if they demonstrate the right general idea, even if wording is loose or incomplete. Be warm and encouraging.`,
  balanced: `The student needs to show the correct core concept, but exact wording is flexible. Minor gaps are acceptable if the key idea is there. Be encouraging.`,
  strict: `Key technical terms and precise language are expected. The student must demonstrate clear understanding with specific vocabulary. Still be encouraging even when marking incorrect.`,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, correct_answer, user_answer, strictness } = body as {
      question: string
      correct_answer: string
      user_answer: string
      strictness: StrictnessLevel
    }

    if (!question || !correct_answer || !user_answer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const level = (strictness ?? "balanced") as StrictnessLevel
    const instruction = STRICTNESS_INSTRUCTIONS[level] ?? STRICTNESS_INSTRUCTIONS.balanced

    const systemPrompt = `You are a friendly and encouraging tutor for Open University students studying TM111 (Introduction to Computing and Information Technology). Your job is to evaluate a student's open-answer response.

${instruction}

Rules for your response:
- Never use em dashes. Use hyphens instead.
- Keep feedback to 2-3 sentences maximum.
- Always be encouraging, even when the answer is incorrect.
- Respond ONLY with valid JSON in this exact format: {"is_correct": true/false, "feedback": "Your feedback here."}
- Do not include any text outside the JSON.`

    const userPrompt = `Question: ${question}

Expected answer (for reference): ${correct_answer}

Student's answer: ${user_answer}

Evaluate whether the student's answer demonstrates understanding of the concept. Reply with JSON only.`

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    const text = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim()
    const result: EvaluationResult = JSON.parse(text)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Evaluate error:", error)
    // Fallback: mark as potentially correct so the student is not penalised for API issues
    return NextResponse.json({
      is_correct: false,
      feedback: "We couldn't evaluate your answer right now - please try again or check the explanation below.",
    } satisfies EvaluationResult)
  }
}
