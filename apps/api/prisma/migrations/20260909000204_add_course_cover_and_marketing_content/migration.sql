/*
  Warnings:

  - You are about to drop the column `coverImageUrl` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "coverImageUrl",
ADD COLUMN     "coverImageKey" TEXT,
ADD COLUMN     "detailedDescription" TEXT,
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetAudience" TEXT,
ADD COLUMN     "whatYouWillLearn" TEXT[] DEFAULT ARRAY[]::TEXT[];
