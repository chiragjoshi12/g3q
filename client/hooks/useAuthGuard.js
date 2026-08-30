"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/store/auth.store";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";

/** Redirects to the login flow when there is no persisted session. */
export function useAuthGuard() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(ROUTES.auth);
    }
  }, [hydrated, isAuthenticated, router]);

  return { ready: hydrated && isAuthenticated, user, hydrated };
}
