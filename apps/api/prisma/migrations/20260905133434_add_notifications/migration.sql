-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXAM_NEEDS_GRADING', 'EXAM_GRADED', 'STUDENT_ENROLLED', 'CERTIFICATE_ISSUED', 'PAYMENT_RECEIVED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "audience" "NotificationAudience" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "studentId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_audience_isRead_createdAt_idx" ON "Notification"("audience", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_studentId_isRead_createdAt_idx" ON "Notification"("studentId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
