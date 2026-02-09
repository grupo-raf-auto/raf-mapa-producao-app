import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from '@/lib/auth-client';

export interface UserStatus {
  role: 'admin' | 'user';
  emailVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SessionUser {
  id: string;
  name?: string;
  email: string;
  image?: string | null;
  role?: string;
  emailVerified?: boolean;
}

export interface AuthState {
  user: SessionUser | null | undefined;
  isLoading: boolean;
  role?: 'admin' | 'user';
  emailVerified?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isAdmin: boolean;
  updateUserStatus: (partial: Partial<UserStatus>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const userId = session?.user?.id ?? null;
  const fetchedForUserIdRef = useRef<string | null>(null);

  const updateUserStatus = useCallback((partial: Partial<UserStatus>) => {
    setUserStatus((prev) => {
      if (prev) return { ...prev, ...partial };
      // ApprovalStatus can set status before /api/user/role has completed; keep a minimal state so redirect works
      if (partial.status != null)
        return {
          role: 'user',
          emailVerified: partial.emailVerified ?? false,
          status: partial.status,
        };
      return null;
    });
  }, []);

  // Clear status when user logs out
  useEffect(() => {
    if (!userId) {
      setUserStatus(null);
      fetchedForUserIdRef.current = null;
    }
  }, [userId]);

  // Sempre verificar o status da conta quando há sessão (inclui a cada reload da página)
  useEffect(() => {
    if (!userId || statusLoading) return;
    if (fetchedForUserIdRef.current === userId) return;

    fetchedForUserIdRef.current = userId;
    const sessionUser = session?.user;
    setStatusLoading(true);
    fetch('/api/user/role', {
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch user status');
      })
      .then((data) => {
        setUserStatus({
          role: data.role || 'user',
          emailVerified: data.emailVerified ?? false,
          status: data.approvalStatus || 'pending',
        });
      })
      .catch((error) => {
        console.error('Failed to fetch user status:', error);
        const fallbackUser = sessionUser as SessionUser | undefined;
        setUserStatus({
          role: (fallbackUser?.role as 'admin' | 'user') || 'user',
          emailVerified: fallbackUser?.emailVerified || false,
          status: 'pending',
        });
      })
      .finally(() => {
        setStatusLoading(false);
      });
  }, [userId, statusLoading, session?.user]);

  const value: AuthState = {
    user: session?.user,
    isLoading:
      isPending ||
      statusLoading ||
      (userId != null && userStatus == null),
    role: userStatus?.role,
    emailVerified: userStatus?.emailVerified ?? (session?.user as SessionUser | undefined)?.emailVerified,
    approvalStatus: userStatus?.status,
    isAdmin: userStatus?.role === 'admin',
    updateUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
