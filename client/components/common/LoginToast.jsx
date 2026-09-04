"use client";

import { useCallback, useEffect, useState } from "react";

import { TopToast } from "@/components/common/TopToast";
import { clearLoginToast, hasLoginToast } from "@/config/routes";

/** Shows a one-shot “you're logged in” banner after OTP success. */
export function LoginToast() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasLoginToast()) setOpen(true);
  }, []);

  const close = useCallback(() => {
    clearLoginToast();
    setOpen(false);
  }, []);

  return <TopToast open={open} message="Successfully logged in!" onClose={close} />;
}
