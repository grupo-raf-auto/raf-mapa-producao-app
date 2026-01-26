import { MainLayout } from "@/components/layout/main-layout";
import { MySabichaoContent } from "@/components/mysabichao/mysabichao-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MySabichaoPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <MainLayout>
      <MySabichaoContent />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
