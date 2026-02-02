-- AlterTable
ALTER TABLE "submission" ADD COLUMN     "creditoProfileId" TEXT,
ADD COLUMN     "imobiliariaProfileId" TEXT,
ADD COLUMN     "modelContext" TEXT,
ADD COLUMN     "seguroProfileId" TEXT;

-- CreateTable
CREATE TABLE "user_model" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creditoProfileId" TEXT,
    "imobiliariaProfileId" TEXT,
    "seguroProfileId" TEXT,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credito_profile" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "registrationDate" TIMESTAMP(3),
    "specialization" TEXT[],
    "totalProduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activeClients" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credito_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imobiliaria_profile" (
    "id" TEXT NOT NULL,
    "agencyName" TEXT,
    "licenseNumber" TEXT,
    "propertyTypes" TEXT[],
    "totalSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activeListings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imobiliaria_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguro_profile" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "insuranceTypes" TEXT[],
    "totalPremiums" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activePolicies" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguro_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_model_creditoProfileId_key" ON "user_model"("creditoProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "user_model_imobiliariaProfileId_key" ON "user_model"("imobiliariaProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "user_model_seguroProfileId_key" ON "user_model"("seguroProfileId");

-- CreateIndex
CREATE INDEX "user_model_userId_idx" ON "user_model"("userId");

-- CreateIndex
CREATE INDEX "user_model_modelType_idx" ON "user_model"("modelType");

-- CreateIndex
CREATE UNIQUE INDEX "user_model_userId_modelType_key" ON "user_model"("userId", "modelType");

-- CreateIndex
CREATE INDEX "submission_modelContext_idx" ON "submission"("modelContext");

-- AddForeignKey
ALTER TABLE "user_model" ADD CONSTRAINT "user_model_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_model" ADD CONSTRAINT "user_model_creditoProfileId_fkey" FOREIGN KEY ("creditoProfileId") REFERENCES "credito_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_model" ADD CONSTRAINT "user_model_imobiliariaProfileId_fkey" FOREIGN KEY ("imobiliariaProfileId") REFERENCES "imobiliaria_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_model" ADD CONSTRAINT "user_model_seguroProfileId_fkey" FOREIGN KEY ("seguroProfileId") REFERENCES "seguro_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_creditoProfileId_fkey" FOREIGN KEY ("creditoProfileId") REFERENCES "credito_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_imobiliariaProfileId_fkey" FOREIGN KEY ("imobiliariaProfileId") REFERENCES "imobiliaria_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_seguroProfileId_fkey" FOREIGN KEY ("seguroProfileId") REFERENCES "seguro_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
