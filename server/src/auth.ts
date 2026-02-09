/**
 * Better Auth configuration for Express backend.
 * Same logic as the React frontend auth (email/password, verification, reset).
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { prisma } from './lib/prisma';
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from './utils/email-reset';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN;
// Backend base URL (where /api/auth is served). Do not use CLIENT_URL here.
const BASE_URL = process.env.API_URL || 'http://localhost:3005';
const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:3004';

if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: BETTER_AUTH_SECRET must be defined in production');
  process.exit(1);
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: BASE_URL,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, token }, _request) => {
      const callbackURL = encodeURIComponent('/reset-password');
      const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&callbackURL=${callbackURL}`;
      await sendResetPasswordEmail({
        to: user.email,
        url: resetUrl,
        userName: user.name,
      });
    },

    onPasswordReset: async ({ user }, _request) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[auth] Password reset completed for:', user.email);
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }, _request) => {
      // Link must hit the backend to verify; then redirect to frontend
      const fullUrl = url.startsWith('http')
        ? url
        : `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
      const parsed = new URL(fullUrl);
      parsed.searchParams.set('callbackURL', `${FRONTEND_URL}/approval-status`);
      await sendVerificationEmail({
        to: user.email,
        url: parsed.toString(),
        userName: user.name,
        appName: process.env.APP_NAME || 'Mapa Produção',
      });
    },
  },

  user: {
    additionalFields: {
      firstName: { type: 'string', required: false, input: true },
      lastName: { type: 'string', required: false, input: true },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
      isActive: {
        type: 'boolean',
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
          const email = (user.email ?? '').toLowerCase();
          const domain = email.split('@')[1];
          if (!domain)
            throw new APIError('BAD_REQUEST', { message: 'Email inválido.' });
          if (domain !== ALLOWED_DOMAIN) {
            throw new APIError('UNPROCESSABLE_ENTITY', {
              message: `Apenas emails @${ALLOWED_DOMAIN} podem registar-se.`,
            });
          }
        },
        after: async (user) => {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'user', status: 'pending' },
            });
          } catch (e) {
            console.error('[auth] databaseHooks.user.create.after:', e);
          }
        },
      },
    },
  },

  trustedOrigins: [
    BASE_URL,
    FRONTEND_URL,
    process.env.CLIENT_URL,
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:3004', 'http://localhost:3006', 'http://127.0.0.1:3004', 'http://127.0.0.1:3006']
      : []),
  ].filter((x): x is string => Boolean(x)),
});
