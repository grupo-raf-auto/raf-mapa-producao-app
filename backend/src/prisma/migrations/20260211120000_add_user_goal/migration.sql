-- CreateTable
CREATE TABLE "user_goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "targetValue" DECIMAL(12,2) NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_goal_userId_key" ON "user_goal"("userId");

-- CreateIndex
CREATE INDEX "user_goal_userId_idx" ON "user_goal"("userId");

-- AddForeignKey
ALTER TABLE "user_goal" ADD CONSTRAINT "user_goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
