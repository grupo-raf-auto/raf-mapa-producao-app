-- CreateTable
CREATE TABLE "document_scan" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "scoreTotal" INTEGER NOT NULL,
    "technicalScore" INTEGER NOT NULL,
    "iaScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "flags" JSONB[],
    "justification" TEXT NOT NULL,
    "technicalFlags" JSONB,
    "aiRisks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "document_scan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_scan" ADD CONSTRAINT "document_scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
