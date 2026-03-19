import { PrismaClient } from "@prisma/client"
import { SEED_QUESTIONS } from "../data/questions"

const prisma = new PrismaClient()

async function main() {
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
      source: q.source,
    })),
  })

  console.log(`Seeded ${SEED_QUESTIONS.length} questions.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
