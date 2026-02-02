-- AlterTable
ALTER TABLE "template" ADD COLUMN     "modelType" TEXT;

-- CreateIndex
CREATE INDEX "template_modelType_idx" ON "template"("modelType");
