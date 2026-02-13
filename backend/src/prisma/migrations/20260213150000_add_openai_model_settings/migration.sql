-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "openaiModelSabichao" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "openaiModelAssistente" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "openaiModelScanner" TEXT;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "openaiModelMyTexto" TEXT;
