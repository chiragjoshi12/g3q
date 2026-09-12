"use client";

import { useCallback, useEffect, useState } from "react";

import { TopToast } from "@/components/common/TopToast";
import {
  clearLoginToast,
  clearLogoutToast,
  hasLoginToast,
  hasLogoutToast,
} from "@/config/routes";
import { useI18n } from "@/lib/i18n";
import { onSessionExpired } from "@/lib/session-expiry";

/** One-shot banners after login success or forced session expiry. */
export function AuthToasts() {
  const { t } = useI18n();
  const [kind, setKind] = useState(null);

  useEffect(() => {
    if (hasLogoutToast()) setKind("logout");
    else if (hasLoginToast()) setKind("login");
    return onSessionExpired(() => setKind("logout"));
  }, []);

  const close = useCallback(() => {
    clearLoginToast();
    clearLogoutToast();
    setKind(null);
  }, []);

  const message = kind === "logout" ? t("loggedOutToast") : kind === "login" ? t("loggedInToast") : null;

  return <TopToast open={Boolean(kind)} message={message} onClose={close} />;
}
