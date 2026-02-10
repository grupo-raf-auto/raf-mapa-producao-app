import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

export function ProtectedRoute({
  children,
  requireAdmin,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isLoading, emailVerified, approvalStatus, isAdmin } = useAuth();
  const location = useLocation();

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

  if (!emailVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  if (
    !isAdmin &&
    approvalStatus != null &&
    approvalStatus !== 'approved' &&
    location.pathname !== '/approval-status' &&
    location.pathname !== '/verify-email'
  ) {
    return <Navigate to="/approval-status" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (
    isAdmin &&
    !location.pathname.startsWith('/admin') &&
    location.pathname !== '/approval-status' &&
    location.pathname !== '/verify-email' &&
    location.pathname !== '/settings' &&
    location.pathname !== '/help'
  ) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
