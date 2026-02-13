-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "sidebarLogo" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "customButtonEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customButtonLabel" TEXT NOT NULL DEFAULT 'CRM MyCredit',
    "customButtonColor" TEXT NOT NULL DEFAULT '#dc2626',
    "customButtonUrl" TEXT NOT NULL DEFAULT 'https://mycredit.pt',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
