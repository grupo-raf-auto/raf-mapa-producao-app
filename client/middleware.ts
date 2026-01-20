import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/webhooks',
  '/not-found',
];
const SESSION_COOKIE = 'better-auth.session_token';
const SESSION_COOKIE_SECURE = '__Secure-better-auth.session_token';

function isPublic(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function hasSessionCookie(cookies: NextRequest['cookies']): boolean {
  return cookies.has(SESSION_COOKIE) || cookies.has(SESSION_COOKIE_SECURE);
}

export function middleware(request: NextRequest) {
  if (isPublic(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request.cookies)) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
