import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Force Node.js runtime for Prisma Client compatibility
export const runtime = 'nodejs';

const publicPaths = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/approval-status',
  '/api/auth',
  '/api/webhooks',
  '/not-found',
];

const SESSION_COOKIE = 'better-auth.session_token';
const SESSION_COOKIE_SECURE = '__Secure-better-auth.session_token';

function isPublic(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function hasSessionCookie(cookies: NextRequest['cookies']): boolean {
  return cookies.has(SESSION_COOKIE) || cookies.has(SESSION_COOKIE_SECURE);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas sem verificação
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Verificar presença do cookie de sessão
  if (!hasSessionCookie(request.cookies)) {
    // API routes devem devolver 401 pelo handler, não redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signIn);
  }

  // Get session and validate role-based access + email verification + approval
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      // Invalid session - redirect to sign-in
      const signIn = new URL('/sign-in', request.url);
      signIn.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signIn);
    }

    // Obter role, emailVerified e status do utilizador (via BD)
    const { prisma } = await import('@/lib/db');
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, emailVerified: true, status: true },
    });

    if (!dbUser) {
      const signIn = new URL('/sign-in', request.url);
      return NextResponse.redirect(signIn);
    }

    const userRole = dbUser.role;
    const emailVerified = dbUser.emailVerified;
    const approvalStatus = dbUser.status;

    // Role-based route protection (only for pages, not API routes)
    if (!pathname.startsWith('/api/')) {
      // Se email não verificado, redirecionar para verify-email (exceto se já estiver lá)
      if (!emailVerified && pathname !== '/verify-email') {
        return NextResponse.redirect(new URL('/verify-email', request.url));
      }

      // Se não aprovado e não admin, redirecionar para approval-status (exceto páginas permitidas)
      if (
        userRole !== 'admin' &&
        approvalStatus !== 'approved' &&
        pathname !== '/approval-status' &&
        pathname !== '/verify-email'
      ) {
        return NextResponse.redirect(new URL('/approval-status', request.url));
      }

      if (pathname.startsWith('/admin')) {
        if (userRole !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } else {
        if (
          userRole === 'admin' &&
          pathname !== '/approval-status' &&
          pathname !== '/verify-email'
        ) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
    }
  } catch (error) {
    // Session validation failed - redirect to sign-in
    console.error('[middleware] Session validation error:', error);
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signIn);
  }

  // Create response with security headers to prevent caching of authenticated pages
  const response = NextResponse.next();

  // Prevent caching of authenticated pages to ensure logout is immediate
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate',
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
