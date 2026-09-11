"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CertificateViewer } from "@/components/certificate/CertificateViewer";
import { ParticipationCertificate } from "@/components/certificate/ParticipationCertificate";
import {
  downloadCertificatePng,
  shareCertificatePng,
} from "@/components/certificate/draw-certificate";
import { EmptyState, LoadingState } from "@/components/common/StateViews";
import { BrandIcon } from "@/components/common/BrandIcon";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { Loader2, X } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { profileController } from "@/controllers/profile.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  attemptEarnsCertificate,
  buildCertificatePayload,
  certificateFileName,
} from "@/lib/domain/certificate";
import { formatGujaratiDate } from "@/lib/domain/format";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

export default function CertificatesPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const { ready } = useAuthGuard();
  const user = useAuthStore((state) => state.user);
  const [previewAttempt, setPreviewAttempt] = useState(null);
  const [busy, setBusy] = useState(null);

  const { status, data } = useAsyncData(
    () => profileController.loadAttempts(user?.id),
    [user?.id],
    ready
  );

  const certificates = (data ?? []).filter(attemptEarnsCertificate);
  const payload = useMemo(
    () => (previewAttempt ? buildCertificatePayload(user, previewAttempt) : null),
    [user, previewAttempt]
  );

  const runAction = async (attemptId, action, work) => {
    setBusy({ attemptId, action });
    try {
      await work();
    } catch {
      /* download / share already surfaces its own fallback */
    } finally {
      setBusy(null);
    }
  };

  return (
    <DesktopAppShell className="bg-[#F2F2F2]">
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F2F2F2] lg:bg-transparent">
      <header className="relative z-10 flex shrink-0 items-center justify-center px-4 pt-7 pb-7 lg:px-10 lg:pt-8 lg:pb-4">
          <button
            type="button"
            onClick={() => router.push(ROUTES.profile)}
            aria-label={t("close")}
            className="absolute left-4 grid size-10 place-items-center rounded-full bg-white transition-transform active:scale-95 lg:left-10"
          >
            <X className="size-4 text-[#111]" strokeWidth={2.2} />
          </button>
          <h1 className="font-heading text-[1.25rem] font-bold text-[#111] lg:text-[2rem] lg:text-[#2d689d]">
            {t("certificates")}
          </h1>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-10 lg:pb-16">
          <div className="mx-auto w-full max-w-[26.5rem] space-y-4 pt-1 md:max-w-[32rem] lg:grid lg:max-w-[56rem] lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:max-w-[64rem]">
            {!ready || status === "loading" ? (
              <LoadingState label={t("certificatesLoading")} className="py-16 lg:col-span-2" />
            ) : null}

            {status === "ready" && certificates.length === 0 ? (
              <EmptyState
                title={t("noCertificatesTitle")}
                description={t("noCertificatesDescription")}
                className="lg:col-span-2"
              />
            ) : null}

            {status === "ready"
              ? certificates.map((attempt) => {
                  const cardPayload = buildCertificatePayload(user, attempt);
                  return (
                    <CertificateCard
                      key={attempt.attemptId}
                      attempt={attempt}
                      language={language}
                      payload={cardPayload}
                      busy={busy?.attemptId === attempt.attemptId ? busy.action : null}
                      onPreview={() => setPreviewAttempt(attempt)}
                      onDownload={() =>
                        runAction(attempt.attemptId, "download", async () => {
                          const fileName = certificateFileName(cardPayload);
                          await downloadCertificatePng(cardPayload, fileName);
                          void trackAnalyticsEvent({
                            eventType: "certificate_download",
                          });
                        })
                      }
                      onShare={() =>
                        runAction(attempt.attemptId, "share", () =>
                          shareCertificatePng(
                            cardPayload,
                            certificateFileName(cardPayload),
                            attempt.quizTitle
                          )
                        )
                      }
                    />
                  );
                })
              : null}
          </div>
        </div>
      </main>

      <CertificateViewer
        open={Boolean(payload)}
        payload={payload}
        onClose={() => setPreviewAttempt(null)}
      />
    </DesktopAppShell>
  );
}

function CertificateCard({ attempt, payload, language, busy, onPreview, onDownload, onShare }) {
  const { t } = useI18n();
  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_1px_3px_rgb(15_23_42/0.06)]">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`${attempt.quizTitle} ${t("viewCertificate")}`}
        className="block w-full px-3.5 pt-3.5"
      >
        <span className="relative block w-full overflow-hidden rounded-[1rem] bg-white">
          <span className="pointer-events-none block">
            <ParticipationCertificate payload={payload} />
          </span>
        </span>
      </button>

      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* move entire box on right side of the screen */}
        <div className="min-w-0 flex-1 ml-[3px]">
          <h2 className="truncate font-heading text-[16px] leading-snug font-bold text-[#111]">
            {attempt.quizTitle}
          </h2>
          <p className="mt-2.5 font-heading text-[14px] text-[#111]">
            {formatGujaratiDate(attempt.completedAt, language)}
          </p>
        </div>
        {/* move entire box slide on bottom side */}
        <div className="flex shrink-0 items-center gap-2 mb-[-12px]">
          <IconButton
            label={t("download")}
            onClick={onDownload}
            disabled={Boolean(busy)}
            className="bg-[#f5f5f5]"
          >
            {busy === "download" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BrandIcon src={BRAND_ICONS.downloadCertificate} alt="" className="size-[18px]" />
            )}
          </IconButton>
          <IconButton
            label={t("share")}
            onClick={onShare}
            disabled={Boolean(busy)}
            className="bg-[#f5f5f5]"
          >
            {busy === "share" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BrandIcon src={BRAND_ICONS.shareQuiz} alt="" className="size-[18px]" />
            )}
          </IconButton>
        </div>
      </div>
    </article>
  );
}

function IconButton({ label, onClick, disabled, className, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-10 place-items-center rounded-full text-[#111] transition-transform active:scale-95 disabled:opacity-45",
        className
      )}
    >
      {children}
    </button>
  );
}
