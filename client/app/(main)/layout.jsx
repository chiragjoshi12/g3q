"use client";

import { Suspense } from "react";

import { Loader2 } from "@/components/icons";

import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * Shell for Home / Profile. Floating nav overlays page content (no gray tray).
 * From `lg` up: left sidebar + grey canvas, no phone frame or bottom nav.
 */
export default function MainLayout({ children }) {
  const { ready } = useAuthGuard();

  return (
    <DesktopAppShell
      className="bg-[#F5F7F9]"
      footer={
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      }
    >
      {ready ? (
        children
      ) : (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary-600" />
        </div>
      )}
    </DesktopAppShell>
  );
}
