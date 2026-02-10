/*
  Warnings:

  - You are about to drop the column `vectorIds` on the `document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "document" DROP COLUMN "vectorIds";

-- AlterTable
ALTER TABLE "question" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "template" ALTER COLUMN "questions" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "template_question" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "template_question_templateId_idx" ON "template_question"("templateId");

-- CreateIndex
CREATE INDEX "template_question_questionId_idx" ON "template_question"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "template_question_templateId_questionId_key" ON "template_question"("templateId", "questionId");

-- CreateIndex
CREATE INDEX "chat_message_conversationId_idx" ON "chat_message"("conversationId");

-- CreateIndex
CREATE INDEX "chat_message_userId_idx" ON "chat_message"("userId");

-- CreateIndex
CREATE INDEX "document_uploadedBy_idx" ON "document"("uploadedBy");

-- CreateIndex
CREATE INDEX "submission_templateId_idx" ON "submission"("templateId");

-- CreateIndex
CREATE INDEX "submission_submittedBy_idx" ON "submission"("submittedBy");

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_question" ADD CONSTRAINT "template_question_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_question" ADD CONSTRAINT "template_question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
