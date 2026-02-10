-- DropForeignKey
ALTER TABLE "document_scan" DROP CONSTRAINT "document_scan_userId_fkey";

-- AddForeignKey
ALTER TABLE "document_scan" ADD CONSTRAINT "document_scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
