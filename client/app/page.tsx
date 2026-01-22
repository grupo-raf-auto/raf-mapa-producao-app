import { MainLayout } from "@/components/layout/main-layout";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  );
}
