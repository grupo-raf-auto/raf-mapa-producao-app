/**
 * Cliente Better Auth para o frontend (React).
 *
 * - useSession: estado da sessão (data, isPending, refetch).
 * - signIn.email / signUp.email / signOut: fluxos de autenticação.
 * - forgetPassword: pedido de recuperação de senha (envia email).
 * - resetPassword: definir nova senha com o token recebido no link.
 */

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

const baseURL =
  typeof window !== "undefined"
    ? undefined
    : process.env.NEXTAUTH_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:3004";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: { credentials: "include" },
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const useSession = authClient.useSession;

// --- Recuperação de senha (endpoints do Better Auth) ---

const authPath = (p: string) => {
  const b = typeof window !== "undefined" ? "" : baseURL || "";
  return `${b}/api/auth${p}`;
};

/**
 * Solicita o email de recuperação de senha.
 * Resposta genérica (não revela se o email existe) para evitar enumeração.
 */
export async function forgetPassword(params: {
  email: string;
  redirectTo?: string;
}): Promise<{ error: { message: string } | null }> {
  const res = await fetch(authPath("/request-password-reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email.trim().toLowerCase(),
      redirectTo: params.redirectTo,
    }),
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    return {
      error: {
        message:
          (data as { error?: string }).error ||
          (data as { message?: string }).message ||
          "Erro ao solicitar recuperação de senha.",
      },
    };
  }
  return { error: null };
}

/**
 * Redefine a senha usando o token recebido no link do email.
 */
export async function resetPassword(params: {
  newPassword: string;
  token: string;
}): Promise<{ error: { message: string } | null }> {
  const res = await fetch(authPath("/reset-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newPassword: params.newPassword,
      token: params.token,
    }),
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    return {
      error: {
        message:
          data.error ||
          data.message ||
          "Erro ao redefinir a senha. O link pode ter expirado.",
      },
    };
  }
  return { error: null };
}
