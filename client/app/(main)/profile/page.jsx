"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  LogOut,
  Trash2,
} from "@/components/icons";

import { CertificateViewer } from "@/components/certificate/CertificateViewer";
import { ConfirmSheet } from "@/components/common/ConfirmSheet";
import { EmptyState, LoadingState } from "@/components/common/StateViews";
import { BrandIcon } from "@/components/common/BrandIcon";
import { AuroraWash } from "@/components/layout/AuroraWash";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { appConfig } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { profileController } from "@/controllers/profile.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { attemptEarnsCertificate, buildCertificatePayload } from "@/lib/domain/certificate";
import { formatDate, formatDuration } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useQuizStore } from "@/store/quiz.store";

const PANEL = {
  MENU: "menu",
  ATTEMPTS: "attempts",
  CERTIFICATES: "certificates",
  HELPLINE: "helpline",
};

const COLUMN = "mx-auto w-full max-w-[26.5rem] md:max-w-[32rem]";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const resetSession = useQuizStore((state) => state.resetSession);
  const [panel, setPanel] = useState(PANEL.MENU);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const userId = user?.id;

  const { status, data: overview, reload } = useAsyncData(
    () => profileController.loadOverview(userId),
    [userId]
  );
  const loading = status === "loading";
  const attempts = overview?.attempts ?? [];
  const certificates = attempts.filter(attemptEarnsCertificate);

  const handleLogout = () => {
    resetSession();
    logout();
    router.replace(ROUTES.auth);
  };

  const handleClearHistory = async () => {
    await profileController.clearHistory(userId);
    resetSession();
    reload();
  };

  return (
    <>
    <main className="no-scrollbar animate-screen-in relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F5F7F9]">
      <div className="relative overflow-hidden pb-[3.75rem]">
        <AuroraWash
          src="/new-gradient-bg.png"
          className="inset-0 h-full"
          imageClassName="object-cover object-top"
        />
        <div className="relative">
          <BrandHeader
            plain
            trailing={
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                aria-label="લોગ આઉટ"
                className="grid size-10 place-items-center rounded-full border border-[#E8ECF0] bg-white transition-transform active:scale-95"
              >
                <LogOut className="size-4.5 text-[#111]" strokeWidth={2} />
              </button>
            }
          />
          <div className={cn(COLUMN)}>
            <div className="h-10" />
          </div>
        </div>
      </div>

      <div className={cn("relative -mt-[3.75rem] px-5 pb-8 sm:px-6", COLUMN)}>
        <div className="flex flex-col items-center text-center">
          <div className="relative z-10 size-[7.5rem] overflow-hidden rounded-full bg-[#d8dde3] ring-[3px] ring-white">
            <Image
              src={BRAND_ICONS.profilePhoto}
              alt={user?.name ?? ""}
              width={240}
              height={240}
              priority
              className="size-full object-cover object-[center_18%]"
            />
          </div>
          <h2 className="mt-6 font-heading text-[18px] leading-tight font-bold text-[#000000]">
            {user?.name}
          </h2>
          {user?.institute ? (
            <p className="mt-2.5 max-w-sm font-heading text-[14px] leading-snug text-[#000000]">
              {user.institute}
            </p>
          ) : null}
          {user?.grade ? (
            <p className="mt-1.5 font-heading text-[14px] text-[#000000]">{user.grade}</p>
          ) : null}
        </div>

        <section className="mt-9 overflow-hidden rounded-[2rem] bg-white shadow-[0_12px_32px_rgb(15_23_42/0.06)]">
          {panel === PANEL.MENU ? (
            <nav>
              <MenuRow
                iconSrc={BRAND_ICONS.quizAttempts}
                iconBg="bg-[#f4e5f8]"
                label="Quiz attempts"
                onClick={() => setPanel(PANEL.ATTEMPTS)}
              />
              <MenuRow
                iconSrc={BRAND_ICONS.certificates}
                iconBg="bg-[#e8f8ed]"
                label="Certificates"
                onClick={() => setPanel(PANEL.CERTIFICATES)}
              />
              <MenuRow
                iconSrc={BRAND_ICONS.aboutAbhinyan}
                iconBg="bg-[#f6f8e5]"
                label="About Abhinyan"
                onClick={() => router.push(ROUTES.abhiyan)}
              />
              <MenuRow
                iconSrc={BRAND_ICONS.helpline}
                iconBg="bg-[#e5ebf8]"
                label="Helpline"
                onClick={() => setPanel(PANEL.HELPLINE)}
                last
              />
            </nav>
          ) : (
            <div className="px-5 py-4">
              <button
                type="button"
                onClick={() => setPanel(PANEL.MENU)}
                className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
              >
                <ChevronLeft className="size-4" />
                પાછળ
              </button>

              {panel === PANEL.ATTEMPTS ? (
                <AttemptsPanel
                  loading={loading}
                  attempts={attempts}
                  onOpen={(id) => router.push(ROUTES.result(id))}
                  onClear={attempts.length > 0 ? handleClearHistory : null}
                />
              ) : null}

              {panel === PANEL.CERTIFICATES ? (
                <CertificatesPanel
                  loading={loading}
                  certificates={certificates}
                  user={user}
                />
              ) : null}

              {panel === PANEL.HELPLINE ? <HelplinePanel /> : null}
            </div>
          )}
        </section>
      </div>
    </main>
      <ConfirmSheet
        open={confirmLogout}
        icon={LogOut}
        title="લોગઆઉટ કરો"
        description="શું તમે ખરેખર તમારા એકાઉન્ટમાંથી લોગ આઉટ કરવા માંગો છો?"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}

function MenuRow({ iconSrc, iconBg, label, onClick, last = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 px-6 py-[1.2rem] text-left transition-colors hover:bg-[#FAFAFA]",
        !last && "border-b border-[#F3F4F6]"
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", iconBg)}>
        <BrandIcon src={iconSrc} alt="" className="size-8" />
      </span>
      <span className="min-w-0 flex-1 font-heading text-[1.05rem] font-semibold text-[#111]">
        {label}
      </span>
      <ChevronLeft className="size-4 shrink-0 rotate-180 text-[#C4C9D1]" strokeWidth={2.2} />
    </button>
  );
}

function AttemptsPanel({ loading, attempts, onOpen, onClear }) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-base font-bold">Quiz attempts</h3>
      {loading ? <LoadingState label="આંકડા લોડ થઈ રહ્યા છે…" className="py-8" /> : null}
      {!loading && attempts.length === 0 ? (
        <EmptyState
          title="હજી કોઈ પ્રયાસ નથી"
          description="ક્વિઝ પૂરી કરો એટલે તમારો ઇતિહાસ અહીં દેખાશે."
        />
      ) : null}
      <ul className="space-y-2">
        {attempts.map((attempt) => (
          <li key={attempt.attemptId}>
            <button
              type="button"
              onClick={() => onOpen(attempt.attemptId)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F8FAFC] p-3 text-left"
            >
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-xl font-heading text-sm font-bold",
                  attempt.percentage >= 60 ? "bg-success/10 text-success" : "bg-warning/15 text-[#8a5a04]"
                )}
              >
                {attempt.percentage}%
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-heading text-sm font-semibold">
                  {attempt.quizTitle}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {attempt.correctCount}/{attempt.totalQuestions} સાચા ·{" "}
                  {formatDuration(attempt.totalTimeMs)} ·{" "}
                  {formatDate(new Date(attempt.completedAt).toISOString())}
                </span>
              </span>
              <ChevronLeft className="size-4 shrink-0 rotate-180 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-error"
        >
          <Trash2 className="size-3.5" />
          ઇતિહાસ ભૂંસો
        </button>
      ) : null}
    </div>
  );
}

function CertificatesPanel({ loading, certificates, user }) {
  const [selected, setSelected] = useState(null);
  const payload = useMemo(
    () => (selected ? buildCertificatePayload(user, selected) : null),
    [user, selected]
  );

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-base font-bold">Certificates</h3>
      {loading ? <LoadingState className="py-8" /> : null}
      {!loading && certificates.length === 0 ? (
        <EmptyState
          title="હજી કોઈ પ્રમાણપત્ર નથી"
          description="60% કે વધુ સાથે ક્વિઝ પૂરી કરો એટલે પ્રમાણપત્ર અહીં દેખાશે."
        />
      ) : null}
      <ul className="space-y-2">
        {certificates.map((attempt) => (
          <li key={attempt.attemptId}>
            <button
              type="button"
              onClick={() => setSelected(attempt)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F8FAFC] p-3 text-left"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FFF1E6]">
                <BrandIcon src={BRAND_ICONS.certificates} alt="" className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-heading text-sm font-semibold">
                  {attempt.quizTitle}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {attempt.percentage}% · {formatDate(new Date(attempt.completedAt).toISOString())}
                </span>
              </span>
              <ChevronLeft className="size-4 shrink-0 rotate-180 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <CertificateViewer
        open={Boolean(payload)}
        payload={payload}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function HelplinePanel() {
  const { phone, display } = appConfig.profile.helpline;

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-base font-bold">Helpline</h3>
      <p className="text-sm text-muted-foreground">
        મદદ માટે નીચેના નંબર પર સંપર્ક કરો.
      </p>
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-3 rounded-2xl bg-[#F8FAFC] p-3"
      >
        <span className="grid size-11 place-items-center rounded-full bg-[#EEF4E8]">
          <BrandIcon src={BRAND_ICONS.helpline} alt="" className="size-6" />
        </span>
        <span className="font-heading text-base font-semibold tracking-wide">{display}</span>
      </a>
    </div>
  );
}
