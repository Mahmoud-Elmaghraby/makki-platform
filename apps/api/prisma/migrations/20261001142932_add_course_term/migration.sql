-- CreateEnum
CREATE TYPE "Term" AS ENUM ('FIRST_TERM', 'SECOND_TERM');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "term" "Term";
