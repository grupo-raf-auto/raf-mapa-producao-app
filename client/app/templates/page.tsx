import { MainLayout } from "@/components/layout/main-layout";
import { TemplatesContent } from "@/components/templates/templates-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";

export default async function TemplatesPage() {
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
      <TemplatesContent />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
