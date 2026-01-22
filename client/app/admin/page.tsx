import { MainLayout } from "@/components/layout/main-layout";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  let isAdmin = false;
  try {
    const user = await api.users.getCurrent();
    isAdmin = user?.role === "admin";
  } catch {
    // ignore
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <MainLayout>
      <AdminDashboard />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
