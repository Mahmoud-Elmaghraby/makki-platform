-- CreateEnum
CREATE TYPE "Faculty" AS ENUM ('LAW_TANTA', 'LAW_ALEXANDRIA', 'LAW_PHAROS', 'SHARIA_AND_LAW');

-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('YEAR_1', 'YEAR_2', 'YEAR_3', 'YEAR_4');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "academicYear" "AcademicYear",
ADD COLUMN     "faculty" "Faculty";
