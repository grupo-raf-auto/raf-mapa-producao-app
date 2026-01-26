import { MainLayout } from "@/components/layout/main-layout";
import { FormulariosContent } from "@/components/formularios/formularios-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function FormulariosPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <MainLayout>
      <FormulariosContent />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
