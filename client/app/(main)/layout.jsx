"use client";

import { Loader2 } from "@/components/icons";

import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { LoginToast } from "@/components/common/LoginToast";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * Shell for the two tab destinations. The quiz and result routes sit
 * outside this group on purpose — they run full-screen without navigation.
 */
export default function MainLayout({ children }) {
  const { ready } = useAuthGuard();

  return (
    <AppShell className="bg-[#F5F7F9]">
      {ready ? (
        children
      ) : (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary-600" />
        </div>
      )}
      <LoginToast />
      <BottomNav />
    </AppShell>
  );
}
