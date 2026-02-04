-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "UserApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable: convert role column (drop default before type change, then restore)
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::"UserRole";

-- AlterTable: convert status column (drop default before type change, then restore)
ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "status" TYPE "UserApprovalStatus" USING "status"::"UserApprovalStatus";
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'pending'::"UserApprovalStatus";
