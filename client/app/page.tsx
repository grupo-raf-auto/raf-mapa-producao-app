import { MainLayout } from "@/components/layout/main-layout";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  );
}
