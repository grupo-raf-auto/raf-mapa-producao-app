"use client";

import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { apiClient as api } from "@/lib/api-client";

let cache: {
  userId: string;
  role: "admin" | "user";
  timestamp: number;
} | null = null;
const CACHE_MS = 5 * 60 * 1000;

export function useUserRole() {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = session?.user;
    if (!user) {
      setLoading(false);
      setUserRole(null);
      return;
    }

    const userId = user.id;
    if (
      cache &&
      cache.userId === userId &&
      Date.now() - cache.timestamp < CACHE_MS
    ) {
      setUserRole(cache.role);
      setLoading(false);
      return;
    }

    let cancelled = false;
    api.users
      .getCurrent()
      .then((d) => {
        if (!cancelled) {
          const role = (d?.role === "admin" ? "admin" : "user") as
            | "admin"
            | "user";
          setUserRole(role);
          cache = { userId, role, timestamp: Date.now() };
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserRole("user");
          cache = { userId, role: "user", timestamp: Date.now() };
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  return { userRole, loading };
}
