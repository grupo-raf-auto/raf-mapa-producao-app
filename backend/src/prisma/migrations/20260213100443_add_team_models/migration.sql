-- CreateTable
CREATE TABLE "team_model" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_model_teamId_idx" ON "team_model"("teamId");

-- CreateIndex
CREATE INDEX "team_model_modelType_idx" ON "team_model"("modelType");

-- CreateIndex
CREATE UNIQUE INDEX "team_model_teamId_modelType_key" ON "team_model"("teamId", "modelType");

-- AddForeignKey
ALTER TABLE "team_model" ADD CONSTRAINT "team_model_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
