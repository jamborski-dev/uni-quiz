-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "block" SMALLINT NOT NULL,
    "topic" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_index" SMALLINT NOT NULL,
    "explanation" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'hardcoded',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_log" (
    "id" UUID NOT NULL,
    "question_id" UUID,
    "block" SMALLINT NOT NULL,
    "topic" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_stats" (
    "topic" TEXT NOT NULL,
    "block" SMALLINT NOT NULL,
    "total_answers" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "last_seen" TIMESTAMPTZ,
    "weakness_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "topic_stats_pkey" PRIMARY KEY ("topic")
);

-- AddForeignKey
ALTER TABLE "answer_log" ADD CONSTRAINT "answer_log_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
