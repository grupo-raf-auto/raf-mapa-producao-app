-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('member', 'coordinator', 'leader');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "teamRole" "TeamRole";

-- CreateTable
CREATE TABLE "objective" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "teamId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objective_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "objective_parentId_idx" ON "objective"("parentId");

-- CreateIndex
CREATE INDEX "objective_teamId_idx" ON "objective"("teamId");

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
