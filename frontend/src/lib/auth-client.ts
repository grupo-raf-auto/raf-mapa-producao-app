/**
 * Better Auth client for React frontend.
 * Auth API is on the same origin (/api/auth) and proxied to backend in dev.
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? '' : undefined,
  fetchOptions: { credentials: 'include' },
});

export const useSession = authClient.useSession;

const authPath = (p: string) => `/api/auth${p}`;

export async function forgetPassword(params: {
  email: string;
  redirectTo?: string;
}): Promise<{ error: { message: string } | null }> {
  const res = await fetch(authPath('/request-password-reset'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email.trim().toLowerCase(),
      redirectTo: params.redirectTo,
    }),
    credentials: 'include',
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    return {
      error: {
        message:
          data.error ??
          data.message ??
          'Erro ao solicitar recuperação de senha.',
      },
    };
  }
  return { error: null };
}

export async function resetPassword(params: {
  newPassword: string;
  token: string;
}): Promise<{ error: { message: string } | null }> {
  const res = await fetch(authPath('/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      newPassword: params.newPassword,
      token: params.token,
    }),
    credentials: 'include',
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    return {
      error: {
        message: data.error ?? data.message ?? 'O link pode ter expirado.',
      },
    };
  }
  return { error: null };
}

export async function getAllowedEmailDomain(): Promise<string | null> {
  const res = await fetch(authPath('/allowed-email-domain'), {
    credentials: 'include',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { allowedEmailDomain?: string | null };
  return data.allowedEmailDomain ?? null;
}
