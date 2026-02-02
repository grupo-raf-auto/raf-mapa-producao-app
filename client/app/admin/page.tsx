import { MainLayout } from "@/components/layout/main-layout";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api.server";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  let isAdmin = false;
  let error: string | null = null;
  
  try {
    const user = await api.users.getCurrent();
    isAdmin = user?.role === "admin";
  } catch (err: unknown) {
    // Verificar se é erro de conexão
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("NetworkError")
    ) {
      error = "Servidor backend não está acessível. Verifique se o servidor está rodando.";
    } else {
      error = `Erro ao verificar permissões: ${errorMessage}`;
    }
    console.error("Erro ao verificar permissões de admin:", err);
  }

  // Se houver erro de conexão, mostrar página de erro em vez de redirecionar
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 p-6 border border-destructive/50 rounded-lg bg-destructive/10 max-w-md">
            <h2 className="text-xl font-semibold text-destructive">
              Erro ao acessar painel admin
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Por favor, verifique se o servidor backend está rodando na porta
                3005.
              </p>
              <p className="font-medium mt-4">Para iniciar o servidor:</p>
              <code className="block bg-muted p-2 rounded text-left mt-2">
                cd server && npm run dev
              </code>
              <p className="text-xs mt-2">
                Ou execute na raiz do projeto:{" "}
                <code className="bg-muted px-1 rounded">npm run dev</code>
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
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
