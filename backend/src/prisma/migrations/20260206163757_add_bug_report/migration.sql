-- CreateTable
CREATE TABLE "bug_report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "readAt" TIMESTAMP(3),
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bug_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bug_report_reportedById_idx" ON "bug_report"("reportedById");

-- CreateIndex
CREATE INDEX "bug_report_status_idx" ON "bug_report"("status");

-- CreateIndex
CREATE INDEX "bug_report_readAt_idx" ON "bug_report"("readAt");

-- AddForeignKey
ALTER TABLE "bug_report" ADD CONSTRAINT "bug_report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
