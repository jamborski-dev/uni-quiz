/*
  Warnings:

  - The primary key for the `topic_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `user_id` to the `answer_log` table without a default value. This is not possible if the table is not empty.
  - Made the column `question_id` on table `answer_log` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `user_id` to the `topic_stats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "answer_log" DROP CONSTRAINT "answer_log_question_id_fkey";

-- AlterTable
ALTER TABLE "answer_log" ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "question_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "further_reading" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "topic_summary" TEXT;

-- AlterTable
ALTER TABLE "topic_stats" DROP CONSTRAINT "topic_stats_pkey",
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "topic_stats_pkey" PRIMARY KEY ("topic", "user_id");

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "quiz_strictness" TEXT NOT NULL DEFAULT 'balanced',

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "answer_log" ADD CONSTRAINT "answer_log_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_log" ADD CONSTRAINT "answer_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_stats" ADD CONSTRAINT "topic_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
