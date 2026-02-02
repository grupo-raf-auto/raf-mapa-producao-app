import { MainLayout } from "@/components/layout/main-layout";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // NEW: Check if user has any models, redirect to select-models if not
  try {
    const headersObj = await headers();
    const token = headersObj.get("Authorization")?.replace("Bearer ", "");

    if (token) {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"}/api/user-models/my-models`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const models = await response.json();
        if (!models || models.length === 0) {
          redirect("/select-models");
        }
      }
    }
  } catch (error) {
    // If check fails, continue to dashboard (user might be initializing models)
    console.error("Error checking user models:", error);
  }

  return (
    <MainLayout>
      <DashboardWrapper />
    </MainLayout>
  );
}
