-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('LEGAL_CONSULTATION', 'COURSE_INQUIRY', 'TRAINING_INQUIRY');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CONSULTATION_REQUEST';

-- AlterTable
ALTER TABLE "ConsultationRequest" ADD COLUMN     "email" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "type" "ConsultationType" NOT NULL DEFAULT 'LEGAL_CONSULTATION';
