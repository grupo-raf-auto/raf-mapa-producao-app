'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { apiClient as api } from '@/lib/api-client';

// Cache global para evitar múltiplas requisições
let userRoleCache: { clerkId: string; role: 'admin' | 'user'; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useUserRole() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setUserRole(null);
      return;
    }

    const clerkId = user.id;

    // Verificar cache primeiro
    if (
      userRoleCache &&
      userRoleCache.clerkId === clerkId &&
      Date.now() - userRoleCache.timestamp < CACHE_DURATION
    ) {
      setUserRole(userRoleCache.role);
      setLoading(false);
      return;
    }

    let cancelled = false;

    api.users
      .getCurrent()
      .then((userData) => {
        if (!cancelled) {
          const role = userData?.role || 'user';
          setUserRole(role);
          
          // Atualizar cache
          userRoleCache = {
            clerkId,
            role,
            timestamp: Date.now(),
          };
          
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback: verificar email
          const adminEmails = ['tiagosousa.tams@hotmail.com'];
          const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
          const isAdminEmail = userEmail && adminEmails.includes(userEmail);
          const role = isAdminEmail ? 'admin' : 'user';
          
          setUserRole(role);
          
          // Atualizar cache mesmo em caso de erro
          userRoleCache = {
            clerkId,
            role,
            timestamp: Date.now(),
          };
          
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { userRole, loading };
}
