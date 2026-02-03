import { MainLayout } from "@/components/layout/main-layout";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Never cache - ensure latest auth state

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  // If no session, redirect to login immediately
  if (!session?.user) {
    redirect("/sign-in");
  }

  // Verify session is still valid (security check)
  // This ensures user can't access dashboard after logout due to caching
  if (!session.user.id || !session.user.email) {
    redirect("/sign-in");
  }

  // Role-based access control: admins must use /admin dashboard
  if (session.user.role === "admin") {
    redirect("/admin");
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
          // Don't cache this check - ensure real-time model validation
          next: { revalidate: 0 },
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
