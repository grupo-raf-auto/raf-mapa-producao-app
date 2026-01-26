import { MainLayout } from "@/components/layout/main-layout";
import { ConsultasContent } from "@/components/consultas/consultas-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ConsultasPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <MainLayout>
      <ConsultasContent />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
