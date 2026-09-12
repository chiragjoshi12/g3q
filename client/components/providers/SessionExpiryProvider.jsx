"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isProtectedPath, markLogoutToast, ROUTES } from "@/config/routes";
import { clearHttpGetCache } from "@/lib/data/sources/http.source";
import { onSessionExpired } from "@/lib/session-expiry";
import { useAuthStore } from "@/store/auth.store";
import { useQuizStore } from "@/store/quiz.store";

/**
 * Listens for 401s from the API client, clears the local session, and
 * sends protected pages back to login.
 */
export function SessionExpiryProvider({ children }) {
  const router = useRouter();

  useEffect(() => {
    return onSessionExpired(() => {
      const { isAuthenticated, logout } = useAuthStore.getState();
      if (!isAuthenticated) return;

      useQuizStore.getState().resetSession();
      logout();
      clearHttpGetCache();
      markLogoutToast();

      if (isProtectedPath(window.location.pathname)) {
        router.replace(ROUTES.auth);
      }
    });
  }, [router]);

  return children;
}
