"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import {
  AUTH_OTP_HELP_ITEM_KEYS,
  AUTH_PHONE_HELP_ITEM_KEYS,
  AUTH_REGISTER_HELP_ITEM_KEYS,
  AUTH_REGISTER_INTRO_KEYS,
  AuthHelpSheet,
} from "@/components/auth/AuthHelpSheet";
import { CategoryStep } from "@/components/auth/CategoryStep";
import { CitizenProfileStep } from "@/components/auth/CitizenProfileStep";
import { ConfirmIdentityStep } from "@/components/auth/ConfirmIdentityStep";
import { OtpStep } from "@/components/auth/OtpStep";
import { PhoneStep } from "@/components/auth/PhoneStep";
import { WelcomeStep } from "@/components/auth/WelcomeStep";
import { WelcomeScreen } from "@/components/landing/WelcomeScreen";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { consumePostAuthPath, markLoginToast, ROUTES } from "@/config/routes";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { useI18n } from "@/lib/i18n";
import { isCitizen } from "@/lib/domain/roles";
import { AUTH_STEP, useAuthStore } from "@/store/auth.store";

/**
 * Login flow container.
 * phone → OTP → existing confirm | signup (category → Appar ID / citizen).
 */
export default function AuthPage() {
  const router = useRouter();
  const { t } = useI18n();
  const hydrated = useStoreHydrated(useAuthStore);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpFocusId, setHelpFocusId] = useState(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const step = useAuthStore((state) => state.step);
  const welcomeSourceStep = useAuthStore((state) => state.welcomeSourceStep);
  const role = useAuthStore((state) => state.role);
  const credential = useAuthStore((state) => state.credential);
  const identity = useAuthStore((state) => state.identity);
  const mobile = useAuthStore((state) => state.mobile);
  const otp = useAuthStore((state) => state.otp);
  const profileName = useAuthStore((state) => state.profileName);
  const profileSurname = useAuthStore((state) => state.profileSurname);
  const profileDistrict = useAuthStore((state) => state.profileDistrict);
  const profileTaluka = useAuthStore((state) => state.profileTaluka);
  const profileDistrictId = useAuthStore((state) => state.profileDistrictId);
  const profileTalukaId = useAuthStore((state) => state.profileTalukaId);
  const consentAccepted = useAuthStore((state) => state.consentAccepted);
  const pendingUser = useAuthStore((state) => state.pendingUser);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const setCredential = useAuthStore((state) => state.setCredential);
  const setMobile = useAuthStore((state) => state.setMobile);
  const setOtp = useAuthStore((state) => state.setOtp);
  const setProfileName = useAuthStore((state) => state.setProfileName);
  const setProfileSurname = useAuthStore((state) => state.setProfileSurname);
  const setProfileDistrict = useAuthStore((state) => state.setProfileDistrict);
  const setProfileTaluka = useAuthStore((state) => state.setProfileTaluka);
  const setConsentAccepted = useAuthStore((state) => state.setConsentAccepted);
  const requestPhoneOtp = useAuthStore((state) => state.requestPhoneOtp);
  const lookupIdentity = useAuthStore((state) => state.lookupIdentity);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const confirmExistingUser = useAuthStore((state) => state.confirmExistingUser);
  const selectSignupRole = useAuthStore((state) => state.selectSignupRole);
  const continueCitizenSignup = useAuthStore((state) => state.continueCitizenSignup);
  const confirmRosterLink = useAuthStore((state) => state.confirmRosterLink);
  const completeCitizenProfile = useAuthStore((state) => state.completeCitizenProfile);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const backToPhone = useAuthStore((state) => state.backToPhone);
  const backToCategory = useAuthStore((state) => state.backToCategory);

  const visibleStep = step === AUTH_STEP.WELCOME ? welcomeSourceStep : step;
  const isRegisterHelp =
    visibleStep === AUTH_STEP.CATEGORY || visibleStep === AUTH_STEP.CREDENTIAL;
  const showHelp =
    visibleStep === AUTH_STEP.PHONE ||
    visibleStep === AUTH_STEP.OTP ||
    isRegisterHelp;
  const helpItemKeys =
    visibleStep === AUTH_STEP.OTP
      ? AUTH_OTP_HELP_ITEM_KEYS
      : isRegisterHelp
        ? AUTH_REGISTER_HELP_ITEM_KEYS
        : AUTH_PHONE_HELP_ITEM_KEYS;
  const helpItems = helpItemKeys.map((item) => ({
    id: item.id,
    question: t(item.questionKey),
    answer: t(item.answerKey),
  }));
  const registerIntroItems = isRegisterHelp
    ? AUTH_REGISTER_INTRO_KEYS.map((item) => ({
        title: t(item.titleKey),
        body: t(item.bodyKey),
      }))
    : undefined;

  const openHelp = (focusId = null) => {
    setHelpFocusId(focusId);
    setHelpOpen(true);
  };

  const headerTitle = (() => {
    if (
      visibleStep === AUTH_STEP.CATEGORY ||
      visibleStep === AUTH_STEP.CREDENTIAL ||
      visibleStep === AUTH_STEP.IDENTITY ||
      visibleStep === AUTH_STEP.PROFILE
    ) {
      return t("register");
    }
    return t("login");
  })();

  const onBack = (() => {
    if (visibleStep === AUTH_STEP.PHONE) {
      return () => router.replace(ROUTES.root);
    }
    if (visibleStep === AUTH_STEP.OTP || visibleStep === AUTH_STEP.CONFIRM) {
      return backToPhone;
    }
    if (visibleStep === AUTH_STEP.CATEGORY) {
      return backToPhone;
    }
    if (visibleStep === AUTH_STEP.CREDENTIAL || visibleStep === AUTH_STEP.PROFILE) {
      return backToCategory;
    }
    if (visibleStep === AUTH_STEP.IDENTITY) {
      return () => useAuthStore.setState({ step: AUTH_STEP.CREDENTIAL, identity: null, error: null });
    }
    return undefined;
  })();

  const goHomeFromWelcome = () => {
    completeLogin();
    markLoginToast();
    router.replace(consumePostAuthPath());
  };

  useEffect(() => {
    setHelpOpen(false);
    setHelpFocusId(null);
  }, [visibleStep]);

  useEffect(() => {
    if (!hydrated) return undefined;
    if (isAuthenticated) {
      router.replace(ROUTES.home);
    }
    return undefined;
  }, [hydrated, isAuthenticated, router]);

  return (
    <DesktopAppShell
      showSidebar={false}
      contentClassName="lg:bg-transparent"
      className="items-center bg-[#f5f5f5] md:items-stretch"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
      >
        <div className="h-full w-full origin-center scale-[1.04] blur-[12px]">
          <WelcomeScreen backdrop />
        </div>
        <div className="absolute inset-0 bg-white/25" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 bg-[#f5f5f5] lg:items-center lg:justify-center lg:bg-transparent lg:px-10 lg:py-8">
        {visibleStep === AUTH_STEP.PHONE ? (
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => router.replace(ROUTES.root)}
            className="absolute inset-0 hidden lg:block"
          />
        ) : null}
        <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#f5f5f5] md:max-w-none lg:h-[min(50rem,82dvh)] lg:w-[min(37rem,90vw)] lg:max-w-[37rem] lg:shrink-0 lg:overflow-hidden lg:rounded-[1.85rem] lg:shadow-[0_24px_64px_rgb(15_23_42/0.22)]">
          <AuthBrandHeader
            title={headerTitle}
            onBack={onBack}
            onHelp={showHelp ? () => openHelp() : undefined}
            helpVariant={isRegisterHelp ? "label" : "icon"}
          />
          <main
            className={`relative min-h-0 flex-1 overscroll-contain px-5 py-0 lg:px-12 lg:pt-3 lg:pb-10 ${
              step === AUTH_STEP.WELCOME ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            {visibleStep === AUTH_STEP.PHONE ? (
              <PhoneStep
                mobile={mobile}
                error={error}
                loading={loading}
                onMobileChange={setMobile}
                onSubmit={requestPhoneOtp}
              />
            ) : null}

            {visibleStep === AUTH_STEP.OTP ? (
              <OtpStep
                otp={otp}
                error={error}
                loading={loading}
                onOtpChange={setOtp}
                onVerify={verifyOtp}
                onBack={backToPhone}
              />
            ) : null}

            {visibleStep === AUTH_STEP.CONFIRM ? (
              <ConfirmIdentityStep
                identity={pendingUser}
                error={error}
                loading={loading}
                onConfirm={() => {
                  if (!confirmExistingUser()) return;
                  markLoginToast();
                  router.replace(consumePostAuthPath());
                }}
              />
            ) : null}

            {visibleStep === AUTH_STEP.CATEGORY || visibleStep === AUTH_STEP.CREDENTIAL ? (
              <CategoryStep
                selectedRole={
                  visibleStep === AUTH_STEP.CREDENTIAL || isCitizen(role) ? role : null
                }
                credential={credential}
                error={error}
                loading={loading}
                onSelect={selectSignupRole}
                onCredentialChange={setCredential}
                onSubmit={lookupIdentity}
                onContinueCitizen={continueCitizenSignup}
                onLearnId={() => openHelp("cts-apaar")}
              />
            ) : null}

            {visibleStep === AUTH_STEP.IDENTITY ? (
              <ConfirmIdentityStep
                identity={identity}
                error={error}
                loading={loading}
                onConfirm={confirmRosterLink}
              />
            ) : null}

            {visibleStep === AUTH_STEP.PROFILE ? (
              <CitizenProfileStep
                name={profileName}
                surname={profileSurname}
                district={profileDistrict}
                taluka={profileTaluka}
                districtId={profileDistrictId}
                talukaId={profileTalukaId}
                consentAccepted={consentAccepted}
                error={error}
                loading={loading}
                onNameChange={setProfileName}
                onSurnameChange={setProfileSurname}
                onDistrictChange={setProfileDistrict}
                onTalukaChange={setProfileTaluka}
                onConsentChange={setConsentAccepted}
                onSubmit={completeCitizenProfile}
              />
            ) : null}
          </main>
          {step === AUTH_STEP.WELCOME ? (
            <WelcomeStep name={pendingUser?.name} onContinue={goHomeFromWelcome} />
          ) : null}
          <AuthHelpSheet
            open={helpOpen && showHelp}
            onClose={() => {
              setHelpOpen(false);
              setHelpFocusId(null);
            }}
            items={helpItems}
            title={isRegisterHelp ? t("authHelpRegisterTitle") : undefined}
            introHeading={isRegisterHelp ? t("authHelpRegisterCategoryIntro") : undefined}
            introItems={registerIntroItems}
            defaultOpenId={helpFocusId}
          />
        </div>
      </div>
    </DesktopAppShell>
  );
}
