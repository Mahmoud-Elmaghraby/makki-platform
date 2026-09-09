-- CreateEnum
CREATE TYPE "CheckpointQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE');

-- CreateTable
CREATE TABLE "VideoCheckpoint" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "timestampSeconds" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type" "CheckpointQuestionType" NOT NULL,
    "options" JSONB,
    "correctOptionId" TEXT,
    "correctBoolean" BOOLEAN,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointResponse" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "booleanAnswer" BOOLEAN,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckpointResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoCheckpoint_lessonId_idx" ON "VideoCheckpoint"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckpointResponse_checkpointId_studentId_key" ON "CheckpointResponse"("checkpointId", "studentId");

-- AddForeignKey
ALTER TABLE "VideoCheckpoint" ADD CONSTRAINT "VideoCheckpoint_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointResponse" ADD CONSTRAINT "CheckpointResponse_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "VideoCheckpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointResponse" ADD CONSTRAINT "CheckpointResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
