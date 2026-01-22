import { MainLayout } from "@/components/layout/main-layout";
import { MySabichaoContent } from "@/components/mysabichao/mysabichao-content";

export default function MySabichaoPage() {
  return (
    <MainLayout>
      <MySabichaoContent />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
