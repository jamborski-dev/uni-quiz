import { PrismaClient } from "@prisma/client"
import { SEED_QUESTIONS } from "../data/questions"

const prisma = new PrismaClient()

// Fixed UUID used by NEXT_PUBLIC_DEV_USER_ID in .env.local
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001"

async function seedDevUser() {
  if (process.env.NODE_ENV === "production") return

  await prisma.profile.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      display_name: "Dev User",
      role: "student",
      quiz_strictness: "balanced",
      question_mode: "mixed",
    },
  })

  console.log(`Dev user seeded (id: ${DEV_USER_ID})`)
}

async function main() {
  console.log("Clearing answer logs and topic stats...")
  await prisma.answerLog.deleteMany()
  await prisma.topicStats.deleteMany()

  console.log("Clearing existing questions...")
  await prisma.question.deleteMany()

  console.log("Seeding questions...")
  await prisma.question.createMany({
    data: SEED_QUESTIONS.map((q) => ({
      block: q.block,
      topic: q.topic,
      type: q.type,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      topic_summary: q.topic_summary ?? null,
      further_reading: (q.further_reading ?? []) as object[],
      source: q.source,
    })),
  })

  console.log(`Seeded ${SEED_QUESTIONS.length} questions.`)

  await seedDevUser()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
