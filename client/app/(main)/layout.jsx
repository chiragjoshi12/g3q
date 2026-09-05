"use client";

import { Loader2 } from "@/components/icons";

import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { LoginToast } from "@/components/common/LoginToast";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * Shell for Home / Profile. Floating nav overlays page content (no gray tray).
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
