import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';
import TravelConnectSignIn from '@/components/ui/travel-connect-signin-1';

export default function SignInPage() {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Spinner variant="bars" className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">A autenticar...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  }

  return <TravelConnectSignIn />;
}
