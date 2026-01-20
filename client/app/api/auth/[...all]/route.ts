import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';

const handler = toNextJsHandler(auth);

function wrap(
  fn: (req: NextRequest, ctx: unknown) => Promise<Response> | Response
) {
  return async (req: NextRequest, ctx: unknown) => {
    try {
      const res = await fn(req, ctx);
      // Log 5xx devolvidos pelo Better Auth (sem throw) para debug
      if (res.status >= 500) {
        try {
          const body = await res.clone().json().catch(() => ({}));
          console.error('[auth/[...all]] 5xx', { url: req.url, status: res.status, body });
        } catch (_) {}
      }
      return res;
    } catch (e) {
      console.error('[auth/[...all]] ERRO (throw)', { url: req.url }, e);
      const err = e as Error & { code?: string; meta?: unknown };
      const msg = err?.message ?? String(e);
      return NextResponse.json(
        {
          error: msg,
          ...(err?.code && { code: err.code }),
          ...(err?.meta != null && { meta: err.meta }),
          ...(process.env.NODE_ENV === 'development' && err?.stack && { __debug: err.stack }),
        },
        { status: 500 }
      );
    }
  };
}

export const GET = wrap(handler.GET as (req: NextRequest, ctx: unknown) => Promise<Response>);
export const POST = wrap(handler.POST as (req: NextRequest, ctx: unknown) => Promise<Response>);
