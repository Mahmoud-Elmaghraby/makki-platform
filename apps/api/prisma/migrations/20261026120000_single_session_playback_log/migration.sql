-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "PlaybackLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaybackLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaybackLog_studentId_createdAt_idx" ON "PlaybackLog"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "PlaybackLog_lessonId_createdAt_idx" ON "PlaybackLog"("lessonId", "createdAt");
