"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { ParticipationCertificate } from "@/components/certificate/ParticipationCertificate";
import { downloadCertificatePng } from "@/components/certificate/draw-certificate";
import { ACTION_BUTTON_CLASS, ActionButtonRow, AppButton } from "@/components/common/AppButton";
import { X } from "@/components/icons";
import { certificateFileName } from "@/lib/domain/certificate";

/**
 * Full-screen landscape certificate preview with a PNG download.
 */
export function CertificateViewer({ open, payload, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !payload || typeof document === "undefined") return null;

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      await downloadCertificatePng(payload, certificateFileName(payload));
    } catch {
      setError("પ્રમાણપત્ર ડાઉનલોડ થઈ શક્યું નથી. ફરી પ્રયાસ કરો.");
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#F5F7F9]">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="બંધ કરો"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgb(15_23_42/0.08)] transition-transform active:scale-95"
        >
          <X className="size-4 text-[#111]" strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-bold text-[#111] md:text-lg">
            Certificate of Participation
          </h2>
          <p className="truncate text-xs text-[#6B7280]">G3Q ID: {payload.g3qId}</p>
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4 md:px-6">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-[#E8ECF0] bg-white shadow-[0_12px_32px_rgb(15_23_42/0.08)]">
          <ParticipationCertificate payload={payload} />
        </div>
        {error ? <p className="mt-3 text-center text-sm text-error">{error}</p> : null}
      </div>

      <footer className="shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <ActionButtonRow>
            <AppButton loading={downloading} onClick={handleDownload} className={ACTION_BUTTON_CLASS}>
              Download certificate
            </AppButton>
          </ActionButtonRow>
        </div>
      </footer>
    </div>,
    document.body
  );
}
