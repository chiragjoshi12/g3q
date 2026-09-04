"use client";

import { useEffect } from "react";

/**
 * Applies Capacitor plugins when the quiz app is running inside the Android
 * WebView. On the regular website this is a no-op.
 */
export function NativeAppBootstrap() {
  useEffect(() => {
    let cancelled = false;
    const listeners = [];

    async function boot() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || cancelled) return;

      const { StatusBar, Style } = await import("@capacitor/status-bar");
      const { SplashScreen } = await import("@capacitor/splash-screen");
      const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
      const { App } = await import("@capacitor/app");

      await StatusBar.setBackgroundColor({ color: "#2C6698" }).catch(() => {});
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
      await SplashScreen.hide().catch(() => {});

      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack || window.history.length > 1) {
          window.history.back();
          return;
        }
        App.exitApp();
      });
      listeners.push(back);
    }

    boot();

    return () => {
      cancelled = true;
      listeners.forEach((listener) => listener.remove());
    };
  }, []);

  return null;
}
