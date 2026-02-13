import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

const ONBOARDING_PATH = '/onboarding';
const ALLOWED_WITHOUT_ONBOARDING = [
  '/sign-in',
  '/verify-email',
  '/approval-status',
  '/forgot-password',
  '/reset-password',
  ONBOARDING_PATH,
];

export function ProtectedRoute({
  children,
  requireAdmin,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isLoading, emailVerified, approvalStatus, isAdmin, hasModels, hasTeam } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="bars" className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!emailVerified && pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  if (
    !isAdmin &&
    approvalStatus != null &&
    approvalStatus !== 'approved' &&
    pathname !== '/approval-status' &&
    pathname !== '/verify-email'
  ) {
    return <Navigate to="/approval-status" replace />;
  }

  // Convidado (user aprovado) só acede ao resto da app após escolher modelo (equipa é facultativa)
  if (
    !requireAdmin &&
    !isAdmin &&
    hasModels === false &&
    !ALLOWED_WITHOUT_ONBOARDING.some((p) => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (
    isAdmin &&
    !pathname.startsWith('/admin') &&
    pathname !== '/approval-status' &&
    pathname !== '/verify-email' &&
    pathname !== '/settings' &&
    pathname !== '/help' &&
    pathname !== '/equipas'
  ) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
