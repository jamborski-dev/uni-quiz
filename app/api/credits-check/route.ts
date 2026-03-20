import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ available: false })

  try {
    const client = new Anthropic({ apiKey: key })
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    })
    return NextResponse.json({ available: true })
  } catch {
    return NextResponse.json({ available: false })
  }
}
