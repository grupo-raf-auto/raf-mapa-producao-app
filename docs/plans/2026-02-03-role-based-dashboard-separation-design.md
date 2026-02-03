# Role-Based Dashboard Separation Architecture

**Date:** 2026-02-03
**Status:** Approved
**Author:** Tiago + Claude Code

## Executive Summary

This design refactors the application's route architecture to completely separate admin and user dashboards based on user roles. After login, users are redirected to role-specific dashboards with distinct capabilities:

- **Users** → `/` (normal dashboard with personal data access)
- **Admins** → `/admin` (administration panel with organization-wide data access)

This creates two completely separate scenarios where admins lose access to the user dashboard routes and can only view data through their own administrative panel with filters.

## Design Principles

1. **Complete Route Separation**: Admins cannot access user dashboard routes; users cannot access admin routes
2. **Defense in Depth**: Two-layer security (middleware + server-side validation)
3. **Reuse Existing Patterns**: Extend current scope-based API filtering rather than duplicating endpoints
4. **Security First**: Follow all security best practices for authentication and authorization

## Current Architecture

### Authentication Stack
- **Better Auth**: Email/password authentication with session cookies (httpOnly, secure)
- **JWT Tokens**: Backend API authentication via Express middleware
- **Role Storage**: User role stored in database (`user.role: "admin" | "user"`)
- **Session Management**: Better Auth handles server-side sessions

### Current Files
- `server/src/middleware/auth.middleware.ts`: JWT validation and role extraction
- `server/src/controllers/submission.controller.ts`: Scope-based filtering (`scope=all` for admins)
- `client/middleware.ts`: Basic session checking (needs enhancement)
- `client/app/page.tsx`: User dashboard entry
- `client/app/admin/page.tsx`: Admin panel entry
- `client/components/layout/main-layout.tsx`: TopBar and layout components

## Section 1: Authentication Flow

### Post-Login Redirect Logic

**Location**: `client/app/sign-in/page.tsx` or post-authentication hook

```typescript
// After successful authentication
const session = await auth.api.getSession();
const userRole = session?.user.role;

if (userRole === 'admin') {
  router.replace('/admin');
} else {
  router.replace('/');
}
```

**Key Points:**
- Use `router.replace()` instead of `router.push()` to prevent back-button navigation
- Check role immediately after authentication succeeds
- Clear any cached user dashboard state before redirecting admins

### Role Persistence
- Role stored in database: `user.role: "admin" | "user"`
- Default role: `"user"`
- First user in system automatically receives `"admin"` role (via `client/lib/auth.ts` databaseHooks)
- Role changes require cache invalidation (5-minute TTL in `use-user-role.ts`)

### Session Management
- Better Auth manages server-side sessions via httpOnly cookies
- JWT tokens generated for backend API calls
- No-cache headers ensure immediate logout/role change effects

## Section 2: Middleware Security

### Enhanced Middleware Implementation

**Location**: `client/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (skip auth check)
  const publicRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check session
  const sessionCookie = request.cookies.get('better-auth.session_token');
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Get user role from session (via API call)
  const session = await getSession(sessionCookie.value);
  if (!session?.user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const userRole = session.user.role;

  // Role-based route protection
  if (pathname.startsWith('/admin')) {
    // Admin routes: only admins allowed
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else {
    // User routes: only users allowed (admins redirected to their panel)
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Add no-cache headers for security
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Helper Function** (compatible with Edge Runtime):

```typescript
async function getSession(token: string) {
  // Lightweight session validation without Prisma
  // Use Better Auth's session API or decode JWT
  // Must be Edge Runtime compatible
}
```

**Security Features:**
- ✅ Prevents users from accessing `/admin/*` routes
- ✅ Prevents admins from accessing user dashboard routes (`/`, `/consultas`, etc.)
- ✅ No-cache headers prevent stale authorization data
- ✅ Edge Runtime compatible (no Prisma calls)
- ✅ Fast redirects before page loads

## Section 3: Admin Dashboard Design

### Route Structure
```
/admin
├── /admin/dashboard     # Admin overview with org-wide metrics
├── /admin/consultas     # All submissions with filters
├── /admin/desempenho    # Performance metrics across all users
└── /admin/utilizadores  # User management
```

### Admin TopBar Components

**Location**: `client/components/layout/main-layout.tsx` (TopBar component)

**Admin TopBar includes:**
- ❌ **NO Model Selector** (admins use filters in Consultas tab instead)
- ✅ CRM MyCredit button
- ✅ Dark mode toggle
- ✅ Reportar Bug button
- ✅ Logout button

### Admin Data Access Pattern

**API Integration**: Reuse existing endpoints with `scope=all` parameter

```typescript
// Example: Fetching submissions in admin dashboard
const response = await api.submissions.list({
  scope: 'all',  // Admin sees all users' data
  modelId: selectedModel,  // From filter dropdown
  userId: selectedUser,    // From filter dropdown (optional)
  startDate: filterStartDate,
  endDate: filterEndDate,
});
```

**Existing Backend Pattern** (`server/src/controllers/submission.controller.ts:227-276`):

```typescript
if (scope === "all" && req.user.role === "admin") {
  // No submittedBy filter - see all data
} else {
  filters.submittedBy = req.user.id; // Personal only
}
```

### Admin Consultas Filters

**Location**: Extend existing filter modal in consultas page

**Admin-specific filters:**
- User selector (dropdown of all users)
- Model type selector (all models available)
- Date range
- Status filters
- Any other existing filters

**Implementation**: Leverage existing filter modal UI, add admin-specific options when `userRole === 'admin'`

### Admin Dashboard Metrics

**Data Scope**: Organization-wide statistics
- Total submissions across all users
- Performance by user/model/region
- Trends and analytics
- User activity monitoring

## Section 4: User Dashboard Design

### Route Structure
```
/
├── /                    # User dashboard (personal metrics)
├── /consultas           # User's submissions only
├── /desempenho          # Personal performance metrics
└── /perfil              # User profile settings
```

### User TopBar Components

**Location**: `client/components/layout/main-layout.tsx` (TopBar component)

**User TopBar includes:**
- ✅ Model Selector (user's assigned models)
- ❌ **NO Admin button** (users cannot access admin routes)
- ✅ CRM MyCredit button
- ✅ Dark mode toggle
- ✅ Reportar Bug button
- ✅ Logout button

**Rationale for NO Admin button:**
- Users cannot access `/admin` routes (blocked by middleware)
- Users become admins only when an existing admin changes their role in the admin panel
- No need to show inaccessible functionality

### User Data Access Pattern

**API Integration**: Existing endpoints with `scope=personal` (default)

```typescript
// Example: Fetching submissions in user dashboard
const response = await api.submissions.list({
  scope: 'personal',  // User sees only their data
  modelId: activeModelId,  // From model selector
  startDate: filterStartDate,
  endDate: filterEndDate,
});
```

**Backend automatically filters** to `submittedBy: req.user.id` when scope is not `'all'` or user is not admin.

### Model Selection Flow

**Current Implementation** (`client/components/layout/model-selector.tsx`):
1. User logs in
2. If no active model, show model selection modal
3. Store selected model in `localStorage.activeModelId`
4. All API calls use active model ID

**No Changes Needed**: This flow continues to work for users.

## Section 5: Security Validation

### Security Checklist

#### Authentication Layer
- ✅ Better Auth handles session cookies (httpOnly, secure in production)
- ✅ JWT tokens for backend API authentication
- ✅ Session validation on every request
- ✅ No-cache headers prevent stale authorization

#### Authorization Layer
- ✅ Middleware blocks route access based on role
- ✅ Server-side validation in all protected pages (defense in depth)
- ✅ API endpoints validate role before returning data
- ✅ Scope-based filtering prevents data leakage

#### Role Management
- ✅ Role stored securely in database
- ✅ Role changes require admin privileges
- ✅ Cache invalidation (5-minute TTL) ensures role changes take effect
- ✅ First user automatically receives admin role

#### Logout Security
- ✅ Clear client-side state (`localStorage`, `sessionStorage`)
- ✅ Invalidate server session via Better Auth
- ✅ Redirect with `router.replace()` to prevent back-button access
- ✅ No-cache headers ensure fresh authentication checks

### Testing Scenarios

#### User Role Testing
1. **Login as user** → Verify redirect to `/`
2. **Navigate to `/admin`** → Verify redirect to `/` (middleware blocks)
3. **Access user routes** → Verify only personal data visible
4. **Check TopBar** → Verify no admin button, model selector present

#### Admin Role Testing
1. **Login as admin** → Verify redirect to `/admin`
2. **Navigate to `/`** → Verify redirect to `/admin` (middleware blocks)
3. **Access admin routes** → Verify all users' data visible with filters
4. **Check TopBar** → Verify no model selector, no admin button

#### Role Change Testing
1. **Admin changes user to admin** → Wait 5 minutes for cache expiry
2. **User refreshes or logs out/in** → Verify new admin access
3. **Admin changes admin to user** → Verify loss of admin access after cache expiry

#### Security Testing
1. **Attempt direct URL navigation** → Verify middleware blocks unauthorized routes
2. **Check API responses** → Verify scope filtering prevents data leakage
3. **Test logout flow** → Verify complete session invalidation
4. **Verify no-cache headers** → Ensure browser doesn't cache protected pages

## Implementation Plan

### Phase 1: Middleware Enhancement
1. Update `client/middleware.ts` with role-based routing logic
2. Implement Edge Runtime-compatible session validation
3. Add no-cache headers for all protected routes
4. Test middleware with both user and admin roles

### Phase 2: Server-Side Validation
1. Add role validation in `client/app/page.tsx` (user dashboard)
2. Add role validation in `client/app/admin/page.tsx` (admin dashboard)
3. Verify redirect logic in both entry points
4. Ensure defense-in-depth security

### Phase 3: Admin Dashboard Updates
1. Remove model selector from admin TopBar (conditional rendering)
2. Update admin consultas page to use `scope=all`
3. Extend filter modal with admin-specific filters (user selector, all models)
4. Test data access with `scope=all` parameter

### Phase 4: User Dashboard Updates
1. Remove admin button from user TopBar
2. Keep model selector for users
3. Verify existing `scope=personal` filtering
4. Test user data isolation

### Phase 5: Security Testing
1. Run through all testing scenarios (see Security Validation section)
2. Verify middleware blocks unauthorized access
3. Verify API endpoints enforce scope filtering
4. Test logout and role change flows
5. Confirm no-cache headers prevent stale data

## Files to Modify

### Critical Files
- `client/middleware.ts` - Add role-based routing logic
- `client/app/page.tsx` - Add server-side role validation for users
- `client/app/admin/page.tsx` - Verify admin role validation
- `client/components/layout/main-layout.tsx` - Update TopBar for both roles
- `client/app/sign-in/page.tsx` - Add post-login redirect logic

### Supporting Files
- `client/app/admin/consultas/page.tsx` - Update to use `scope=all` and filters
- `client/components/admin/*` - Update admin components to consume org-wide data
- `server/src/controllers/*.controller.ts` - Verify scope filtering (already implemented)

## Dependencies

### Existing Dependencies (No Changes)
- Better Auth: Session management
- Next.js 14+ App Router: Server Components and middleware
- Prisma + PostgreSQL: Database and role storage
- JWT: Backend API authentication

### No New Dependencies Required
- All functionality can be implemented with existing stack
- Reuse existing API patterns and components
- Extend current filter modal rather than creating new components

## Risks and Mitigations

### Risk 1: Cache Invalidation Delay
**Risk**: Role changes take up to 5 minutes to take effect (cache TTL)
**Mitigation**: Document this behavior for admins; consider manual cache clear on role change; acceptable trade-off for performance

### Risk 2: Middleware Edge Runtime Limitations
**Risk**: Cannot use Prisma in Edge Runtime for session validation
**Mitigation**: Use Better Auth's session API or lightweight JWT decoding; keep middleware fast and simple

### Risk 3: Back-Button Navigation After Role Change
**Risk**: User might navigate back to unauthorized pages using browser back button
**Mitigation**: No-cache headers + middleware redirects prevent access; server-side validation ensures defense in depth

## Success Criteria

1. ✅ Users cannot access `/admin` routes (middleware blocks)
2. ✅ Admins cannot access user dashboard routes (middleware blocks)
3. ✅ Admin dashboard shows organization-wide data with filters
4. ✅ User dashboard shows only personal data
5. ✅ TopBar components reflect role-appropriate functionality
6. ✅ Security testing passes all scenarios
7. ✅ No data leakage between roles
8. ✅ Logout fully invalidates session
9. ✅ Role changes take effect within cache TTL

## Notes

- Admin does not need model selector; will use filters in Consultas tab
- User TopBar should not show admin button (users can't access admin routes)
- Leverage existing filter modal in consultas page for admin-specific filters
- First user in system automatically receives admin role
- Users become admins only when existing admin changes their role

---

**Design Status**: ✅ Approved
**Ready for Implementation**: Yes
**Next Step**: Execute implementation plan starting with Phase 1 (Middleware Enhancement)
