-- AlterTable: ao eliminar um template, eliminar em cascata as submissões associadas
ALTER TABLE "submission" DROP CONSTRAINT "submission_templateId_fkey";
ALTER TABLE "submission" ADD CONSTRAINT "submission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
