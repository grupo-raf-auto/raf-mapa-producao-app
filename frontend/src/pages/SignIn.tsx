import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';
import TravelConnectSignIn from '@/components/ui/travel-connect-signin-1';

export default function SignInPage() {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="bars" className="h-8 w-8" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  }

  return <TravelConnectSignIn />;
}
