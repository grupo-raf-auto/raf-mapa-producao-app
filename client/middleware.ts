import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Force Node.js runtime for Prisma Client compatibility
export const runtime = "nodejs";

const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/webhooks",
  "/not-found",
];

const SESSION_COOKIE = "better-auth.session_token";
const SESSION_COOKIE_SECURE = "__Secure-better-auth.session_token";

function isPublic(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function hasSessionCookie(cookies: NextRequest["cookies"]): boolean {
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
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  // Get session and validate role-based access
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      // Invalid session - redirect to sign-in
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signIn);
    }

    const userRole = session.user.role;

    // Role-based route protection (only for pages, not API routes)
    // API routes should handle authorization themselves, not redirect
    if (!pathname.startsWith("/api/")) {
      if (pathname.startsWith("/admin")) {
        // Admin routes: only admins allowed
        if (userRole !== "admin") {
          // User trying to access admin routes - redirect to user dashboard
          return NextResponse.redirect(new URL("/", request.url));
        }
      } else {
        // User routes: only users allowed (admins redirected to their panel)
        if (userRole === "admin") {
          // Admin trying to access user routes - redirect to admin dashboard
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      }
    }
  } catch (error) {
    // Session validation failed - redirect to sign-in
    console.error("[middleware] Session validation error:", error);
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  // Create response with security headers to prevent caching of authenticated pages
  const response = NextResponse.next();

  // Prevent caching of authenticated pages to ensure logout is immediate
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
