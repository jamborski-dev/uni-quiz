import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SEED_QUESTIONS } from "@/data/questions";
import type { Block } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const blockParam = searchParams.get("block");
  const block =
    blockParam && blockParam !== "all" ? (Number(blockParam) as Block) : null;

  try {
    const where = block ? { block } : {};
    const data = await prisma.question.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    if (data.length > 0) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      return NextResponse.json({ questions: shuffled });
    }
  } catch {
    // DB not configured yet — fall through to seed data
  }

  // Fallback: hardcoded seed questions
  const filtered = block
    ? SEED_QUESTIONS.filter((q) => q.block === block)
    : SEED_QUESTIONS;

  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return NextResponse.json({ questions: shuffled });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question_id, block, topic, is_correct } = body as {
      question_id: string;
      block: number;
      topic: string;
      is_correct: boolean;
    };

    await prisma.answerLog.create({
      data: { question_id, block, topic, is_correct },
    });

    // Upsert topic stats
    await prisma.topicStats.upsert({
      where: { topic },
      create: {
        topic,
        block,
        total_answers: 1,
        correct: is_correct ? 1 : 0,
        last_seen: new Date(),
        weakness_score: is_correct ? 0.3 : 0.7,
      },
      update: {
        total_answers: { increment: 1 },
        correct: is_correct ? { increment: 1 } : undefined,
        last_seen: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Silently ignore logging errors in dev (DB may not be set up)
    return NextResponse.json({ ok: false });
  }
}
