/**
 * Configuração do Better Auth – autenticação por email e senha.
 *
 * - Cadastro: email único, senha com regras mínimas (min 8, max 128), hashing seguro (scrypt).
 * - Login: email + senha, sessão em cookie (httpOnly, secure em produção).
 * - Logout: invalidação da sessão no servidor.
 * - Recuperação de senha: token com expiração (1h), envio por email (Resend ou log em dev).
 *
 * Segurança: validação de domínio opcional (ALLOWED_EMAIL_DOMAIN), rate limiting
 * recomendado no edge/upstream, revogação de outras sessões ao trocar senha.
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { prisma } from "./db";
import { createAppToken } from "./jwt";
import { sendResetPasswordEmail } from "./email-reset";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN; // ex: "gruporaf.pt" – se vazio, qualquer email
const BASE_URL =
  process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "http://localhost:3004";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: BASE_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [nextCookies()],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hora, em segundos
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, token }, _request) => {
      const base =
        process.env.NEXTAUTH_URL ||
        process.env.CLIENT_URL ||
        "http://localhost:3004";
      const callbackURL = encodeURIComponent("/reset-password");
      const resetUrl = `${base}/api/auth/reset-password/${token}?callbackURL=${callbackURL}`;
      await sendResetPasswordEmail({
        to: user.email,
        url: resetUrl,
        userName: user.name,
      });
    },

    onPasswordReset: async ({ user }, _request) => {
      // Opcional: auditoria, notificação, etc.
      if (process.env.NODE_ENV === "development") {
        console.log("[auth] Password reset completed for:", user.email);
      }
    },
  },

  user: {
    additionalFields: {
      firstName: { type: "string", required: false, input: true },
      lastName: { type: "string", required: false, input: true },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!ALLOWED_DOMAIN) return;
          const email = (user.email ?? "").toLowerCase();
          const domain = email.split("@")[1];
          if (!domain)
            throw new APIError("BAD_REQUEST", { message: "Email inválido." });
          if (domain !== ALLOWED_DOMAIN) {
            throw new APIError("UNPROCESSABLE_ENTITY", {
              message: `Apenas emails @${ALLOWED_DOMAIN} podem registar-se.`,
            });
          }
        },
        after: async (user) => {
          try {
            const count = await prisma.user.count();
            await prisma.user.update({
              where: { id: user.id },
              data: {
                emailVerified: true,
                ...(count === 1 ? { role: "admin" } : {}),
              },
            });

            // Criar modelo padrão (Crédito) para o novo utilizador
            try {
              // Criar profile de Crédito
              const creditoProfile = await prisma.creditoProfile.create({ data: {} });

              // Criar UserModel associado
              await prisma.userModel.create({
                data: {
                  userId: user.id,
                  modelType: "credito",
                  creditoProfileId: creditoProfile.id,
                  isActive: true,
                },
              });

              console.log("[auth] Default credit model created for user:", user.id);
            } catch (modelError) {
              console.error("[auth] Error creating default model:", modelError);
            }
          } catch (e) {
            console.error("[auth] databaseHooks.user.create.after:", e);
          }
        },
      },
    },
  },

  trustedOrigins: [BASE_URL, process.env.CLIENT_URL].filter((x): x is string =>
    Boolean(x),
  ),
});

// --- Helpers para integração com o backend Express (JWT) ---

export async function getAuthTokenServer(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return createAppToken({
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
}

export async function getAuthHeadersServer(): Promise<Record<string, string>> {
  const token = await getAuthTokenServer();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
