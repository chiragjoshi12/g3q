"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LineArrowRight, LogOut, User } from "@/components/icons";

import { ConfirmSheet } from "@/components/common/ConfirmSheet";
import { HelplineSheet } from "@/components/common/HelplineSheet";
import { BrandIcon } from "@/components/common/BrandIcon";
import { AuroraWash } from "@/components/layout/AuroraWash";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { LANGUAGE_OPTIONS } from "@/config/languages";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { profileController } from "@/controllers/profile.controller";
import { toMessage } from "@/lib/core/errors";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { compressProfilePhoto } from "@/lib/compress-profile-photo";
import { useI18n } from "@/lib/i18n";
import { resolveProfilePhotoSrc } from "@/lib/profile-photo";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useLanguageStore } from "@/store/language.store";
import { useQuizStore } from "@/store/quiz.store";

const COLUMN = "mx-auto w-full max-w-[26.5rem] md:max-w-[32rem]";

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const sessionUser = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const logout = useAuthStore((state) => state.logout);
  const resetSession = useQuizStore((state) => state.resetSession);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [helplineOpen, setHelplineOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const syncedMeRef = useRef(false);

  const user = sessionUser;
  const photoSrc = resolveProfilePhotoSrc(user);

  useEffect(() => {
    if (syncedMeRef.current) return undefined;
    if (appConfig.dataSource !== DATA_SOURCE.REST) return undefined;
    syncedMeRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const liveUser = await profileController.loadMe();
        if (!cancelled && liveUser) patchUser(liveUser);
      } catch {
        // Keep session user if /me fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patchUser]);

  useEffect(() => {
    if (!languageOpen) return undefined;
    const onPointerDown = (event) => {
      if (!event.target.closest("[data-language-menu]")) {
        setLanguageOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [languageOpen]);

  const handleLogout = () => {
    resetSession();
    logout();
    router.replace(ROUTES.auth);
  };

  const handlePickPhoto = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const type = String(file.type || "").toLowerCase();
    if (type && !type.startsWith("image/")) {
      setUploadError(t("photoTypeError"));
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const compressed = await compressProfilePhoto(file);
      const updated = await profileController.uploadPhoto(compressed);
      if (updated) patchUser(updated);
    } catch (error) {
      setUploadError(toMessage(error) || t("photoUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const languageMenu = (
    <LanguageMenu
      open={languageOpen}
      onToggle={() => setLanguageOpen((open) => !open)}
      language={language}
      onSelect={(id) => {
        setLanguage(id);
        setLanguageOpen(false);
      }}
      label={t("language")}
      selectLabel={t("selectLanguage")}
    />
  );

  return (
    <>
    <main className="no-scrollbar animate-screen-in relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F5F7F9] pb-32 lg:bg-transparent lg:pb-16">
      <div className={cn("relative pb-[3.75rem] lg:hidden", languageOpen && "z-40")}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <AuroraWash
            src="/new-gradient-bg.png"
            className="inset-0 h-full"
            imageClassName="object-cover object-top"
          />
        </div>
        <div className="relative z-20">
          <BrandHeader plain trailing={languageMenu} />
          <div className={cn(COLUMN)}>
            <div className="h-10" />
          </div>
        </div>
      </div>

      <header className="relative z-20 hidden shrink-0 justify-end px-10 pt-8 lg:flex">
        <LanguageMenu
          open={languageOpen}
          onToggle={() => setLanguageOpen((open) => !open)}
          language={language}
          onSelect={(id) => {
            setLanguage(id);
            setLanguageOpen(false);
          }}
          label={t("language")}
          selectLabel={t("selectLanguage")}
          buttonClassName="size-11 shadow-[0_8px_24px_rgb(15_23_42/0.08)]"
        />
      </header>

      <div className={cn("relative -mt-[3.75rem] px-5 pb-8 sm:px-6 lg:mt-2 lg:max-w-[36rem] lg:px-0", COLUMN, languageOpen && "z-0")}>
        <div className="flex flex-col items-center text-center">
          <div className="relative z-10">
            <div className="grid size-[7.5rem] place-items-center overflow-hidden rounded-full bg-[#d8dde3] ring-[3px] ring-white lg:size-[8.75rem] lg:ring-[4px]">
              {photoSrc ? (
                <Image
                  src={photoSrc}
                  alt={user?.name ?? ""}
                  width={240}
                  height={240}
                  priority
                  unoptimized={photoSrc.startsWith("http")}
                  className="size-full object-cover object-[center_18%]"
                />
              ) : (
                <User className="size-14 text-[#6b7280] lg:size-16" strokeWidth={1.6} />
              )}
            </div>
            <button
              type="button"
              onClick={handlePickPhoto}
              disabled={uploading}
              aria-label={t("editProfilePhoto")}
              className="absolute right-0 bottom-0 grid size-10 place-items-center rounded-full border border-[#E8ECF0] bg-white text-[#111] shadow-[0_4px_14px_rgb(15_23_42/0.12)] transition-transform active:scale-95 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden>
                <path
                  d="M4 16.5V19a1 1 0 0 0 1 1h2.5M14.5 5.5l4 4M8.2 17.8 18 8a1.4 1.4 0 0 0 0-2l-2-2a1.4 1.4 0 0 0-2 0L6.2 13.8a2 2 0 0 0-.5.9L5 18l3.3-.7a2 2 0 0 0 .9-.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />
          </div>
          {uploading ? (
            <p className="mt-3 font-heading text-sm text-[#555]">{t("photoUploading")}</p>
          ) : null}
          {uploadError ? (
            <p className="mt-3 max-w-sm font-heading text-sm text-error">{uploadError}</p>
          ) : null}
          <h2 className="mt-4 font-heading text-[20px] leading-tight font-bold text-[#000000] lg:mt-5 lg:text-[1.75rem]">
            {user?.name}
          </h2>
          {user?.institute ? (
            <p className="mt-2.5 max-w-sm font-heading text-[16px] leading-snug text-[#000000]">
              {user.institute}
            </p>
          ) : null}
          {user?.grade ? (
            <p className="mt-1.5 font-heading text-[16px] text-[#000000]">{user.grade}</p>
          ) : null}
        </div>

        <section className="mt-7 overflow-hidden rounded-[2rem] bg-white lg:mt-9 lg:shadow-[0_12px_40px_rgb(15_23_42/0.06)]">
          <nav>
            <MenuRow
              iconSrc={BRAND_ICONS.quizAttempts}
              iconBg="bg-[#f4e5f8]"
              label={t("quizAttempts")}
              onClick={() => router.push(ROUTES.quizAttempts)}
            />
            <MenuRow
              iconSrc={BRAND_ICONS.certificates}
              iconBg="bg-[#e8f8ed]"
              label={t("certificates")}
              onClick={() => router.push(ROUTES.certificates)}
            />
            <MenuRow
              iconSrc={BRAND_ICONS.aboutAbhinyan}
              iconBg="bg-[#f6f8e5]"
              label={t("aboutAbhiyan")}
              onClick={() => router.push(ROUTES.abhiyan)}
            />
            <MenuRow
              iconSrc={BRAND_ICONS.helpline}
              iconBg="bg-[#e5ebf8]"
              label={t("helpline")}
              onClick={() => setHelplineOpen(true)}
            />
            <MenuRow
              icon={
                <LogOut className="size-6 text-[#111]" strokeWidth={2} />
              }
              iconBg="bg-[#f3f4f6]"
              label={t("logout")}
              onClick={() => setConfirmLogout(true)}
              last
            />
          </nav>
        </section>
      </div>
    </main>
      <ConfirmSheet
        open={confirmLogout}
        icon={LogOut}
        title={t("logout")}
        description={t("logoutDescription")}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
      <HelplineSheet open={helplineOpen} onClose={() => setHelplineOpen(false)} />
    </>
  );
}

function LanguageMenu({
  open,
  onToggle,
  language,
  onSelect,
  label,
  selectLabel,
  buttonClassName,
}) {
  return (
    <div data-language-menu className="relative z-50">
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "grid size-10 place-items-center rounded-full border border-[#E8ECF0] bg-white text-[#111] transition-transform active:scale-95",
          buttonClassName
        )}
      >
        <BrandIcon src={BRAND_ICONS.language} alt="" className="size-5" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={selectLabel}
          className="absolute top-[calc(100%+0.55rem)] right-0 z-50 w-[14.5rem] rounded-[1.35rem] bg-white p-3 shadow-[0_14px_36px_rgb(15_23_42/0.18)]"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const active = language === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => onSelect(option.id)}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition-colors",
                  active ? "bg-[#E8E8E8]" : "hover:bg-[#F3F3F3]"
                )}
              >
                <BrandIcon src={BRAND_ICONS.language} alt="" className="size-6 shrink-0" />
                <span
                  className={cn(
                    "font-heading text-[16px] tracking-[0.03em] text-[#111] uppercase",
                    active ? "font-bold" : "font-medium"
                  )}
                >
                  {option.englishLabel}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({ iconSrc, icon, iconBg, label, onClick, last = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-[1.2rem] text-left transition-colors hover:bg-[#FAFAFA]",
        !last && "border-b border-[#F3F4F6]"
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center overflow-hidden rounded-full", iconBg)}>
        {icon ? icon : <BrandIcon src={iconSrc} alt="" className="size-6" />}
      </span>
      <span className="min-w-0 flex-1 font-heading text-[1.05rem] font-semibold text-[#111]">
        {label}
      </span>
      <LineArrowRight className="size-4 shrink-0 text-black" />
    </button>
  );
}
