"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { BetaLoginStep } from "@/components/auth/BetaLoginStep";
import { CategoryStep } from "@/components/auth/CategoryStep";
import { CitizenProfileStep } from "@/components/auth/CitizenProfileStep";
import { ConfirmIdentityStep } from "@/components/auth/ConfirmIdentityStep";
import { OtpStep } from "@/components/auth/OtpStep";
import { PhoneStep } from "@/components/auth/PhoneStep";
import { RosterCredentialStep } from "@/components/auth/RosterCredentialStep";
import { WelcomeStep } from "@/components/auth/WelcomeStep";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { appConfig } from "@/config/app.config";
import { consumePostAuthPath, markLoginToast, ROUTES } from "@/config/routes";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { useI18n } from "@/lib/i18n";
import { AUTH_STEP, useAuthStore } from "@/store/auth.store";
import { useLanguageStore } from "@/store/language.store";

/**
 * Login flow container.
 * Beta: registration form → session.
 * Production: phone → OTP → existing confirm | signup (category → ABC/citizen).
 */
export default function AuthPage() {
  const router = useRouter();
  const { t } = useI18n();
  const hydrated = useStoreHydrated(useAuthStore);
  const betaEnabled = appConfig.beta.enabled;

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const step = useAuthStore((state) => state.step);
  const welcomeSourceStep = useAuthStore((state) => state.welcomeSourceStep);
  const role = useAuthStore((state) => state.role);
  const credential = useAuthStore((state) => state.credential);
  const identity = useAuthStore((state) => state.identity);
  const phone = useAuthStore((state) => state.phone);
  const otp = useAuthStore((state) => state.otp);
  const profileFirstName = useAuthStore((state) => state.profileFirstName);
  const profileLastName = useAuthStore((state) => state.profileLastName);
  const profileName = useAuthStore((state) => state.profileName);
  const profileDistrict = useAuthStore((state) => state.profileDistrict);
  const profileTaluka = useAuthStore((state) => state.profileTaluka);
  const profileDistrictId = useAuthStore((state) => state.profileDistrictId);
  const profileTalukaId = useAuthStore((state) => state.profileTalukaId);
  const pendingUser = useAuthStore((state) => state.pendingUser);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const setCredential = useAuthStore((state) => state.setCredential);
  const setPhone = useAuthStore((state) => state.setPhone);
  const setOtp = useAuthStore((state) => state.setOtp);
  const setProfileFirstName = useAuthStore((state) => state.setProfileFirstName);
  const setProfileLastName = useAuthStore((state) => state.setProfileLastName);
  const setProfileName = useAuthStore((state) => state.setProfileName);
  const setProfileDistrict = useAuthStore((state) => state.setProfileDistrict);
  const setProfileTaluka = useAuthStore((state) => state.setProfileTaluka);
  const requestPhoneOtp = useAuthStore((state) => state.requestPhoneOtp);
  const lookupIdentity = useAuthStore((state) => state.lookupIdentity);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const confirmExistingUser = useAuthStore((state) => state.confirmExistingUser);
  const selectSignupRole = useAuthStore((state) => state.selectSignupRole);
  const confirmRosterLink = useAuthStore((state) => state.confirmRosterLink);
  const completeCitizenProfile = useAuthStore((state) => state.completeCitizenProfile);
  const betaLogin = useAuthStore((state) => state.betaLogin);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const backToPhone = useAuthStore((state) => state.backToPhone);
  const backToCategory = useAuthStore((state) => state.backToCategory);

  const visibleStep = step === AUTH_STEP.WELCOME ? welcomeSourceStep : step;

  const headerTitle = (() => {
    if (betaEnabled) return t("login");
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
    if (betaEnabled && visibleStep === AUTH_STEP.CREDENTIAL) {
      return () => {
        useLanguageStore.getState().clearLanguageChoice();
        router.replace(ROUTES.root);
      };
    }
    if (visibleStep === AUTH_STEP.PHONE) {
      return () => {
        useLanguageStore.getState().clearLanguageChoice();
        router.replace(ROUTES.root);
      };
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
    if (!hydrated) return undefined;
    if (isAuthenticated) {
      router.replace(ROUTES.home);
    }
    return undefined;
  }, [hydrated, isAuthenticated, router]);

  // Beta keeps CREDENTIAL as first step.
  useEffect(() => {
    if (!hydrated || !betaEnabled) return;
    if (step === AUTH_STEP.PHONE) {
      useAuthStore.setState({ step: AUTH_STEP.CREDENTIAL, role: null });
    }
  }, [hydrated, betaEnabled, step]);

  return (
    <DesktopAppShell
      showSidebar={false}
      className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F7F5F2]"
    >
      <div className="flex h-full min-h-0 w-full flex-1 lg:items-center lg:justify-center lg:px-10 lg:py-8">
        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-gradient-to-b from-[#FBF8F4] to-[#F3F3F3] md:max-w-none lg:h-[min(58rem,92dvh)] lg:w-[min(42rem,90vw)] lg:max-w-[42rem] lg:overflow-hidden lg:rounded-[1.85rem] lg:bg-white lg:shadow-[0_24px_80px_rgb(15_23_42/0.12)]">
          <AuthBrandHeader title={headerTitle} onBack={onBack} />
          <main
            className={`no-scrollbar relative min-h-0 flex-1 overscroll-contain px-5 py-2 lg:px-12 lg:py-10 ${
              step === AUTH_STEP.WELCOME ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            {betaEnabled && visibleStep === AUTH_STEP.CREDENTIAL ? (
              <BetaLoginStep
                firstName={profileFirstName}
                lastName={profileLastName}
                district={profileDistrict}
                taluka={profileTaluka}
                districtId={profileDistrictId}
                talukaId={profileTalukaId}
                phone={credential}
                error={error}
                loading={loading}
                onFirstNameChange={setProfileFirstName}
                onLastNameChange={setProfileLastName}
                onDistrictChange={setProfileDistrict}
                onTalukaChange={setProfileTaluka}
                onPhoneChange={setCredential}
                onSubmit={betaLogin}
              />
            ) : null}

            {!betaEnabled && visibleStep === AUTH_STEP.PHONE ? (
              <PhoneStep
                phone={phone}
                error={error}
                loading={loading}
                onPhoneChange={setPhone}
                onSubmit={requestPhoneOtp}
              />
            ) : null}

            {!betaEnabled && visibleStep === AUTH_STEP.OTP ? (
              <OtpStep
                otp={otp}
                error={error}
                loading={loading}
                onOtpChange={setOtp}
                onVerify={verifyOtp}
                onBack={backToPhone}
              />
            ) : null}

            {!betaEnabled && visibleStep === AUTH_STEP.CONFIRM ? (
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

            {!betaEnabled && visibleStep === AUTH_STEP.CATEGORY ? (
              <CategoryStep onSelect={selectSignupRole} />
            ) : null}

            {!betaEnabled && visibleStep === AUTH_STEP.CREDENTIAL ? (
              <RosterCredentialStep
                role={role}
                credential={credential}
                error={error}
                loading={loading}
                onCredentialChange={setCredential}
                onSubmit={lookupIdentity}
              />
            ) : null}

            {!betaEnabled && visibleStep === AUTH_STEP.IDENTITY ? (
              <ConfirmIdentityStep
                identity={identity}
                error={error}
                loading={loading}
                onConfirm={confirmRosterLink}
              />
            ) : null}

            {!betaEnabled && visibleStep === AUTH_STEP.PROFILE ? (
              <CitizenProfileStep
                name={profileName}
                district={profileDistrict}
                taluka={profileTaluka}
                districtId={profileDistrictId}
                talukaId={profileTalukaId}
                error={error}
                loading={loading}
                onNameChange={setProfileName}
                onDistrictChange={setProfileDistrict}
                onTalukaChange={setProfileTaluka}
                onSubmit={completeCitizenProfile}
              />
            ) : null}
          </main>
          {step === AUTH_STEP.WELCOME ? (
            <WelcomeStep name={pendingUser?.name} onContinue={goHomeFromWelcome} />
          ) : null}
        </div>
      </div>
    </DesktopAppShell>
  );
}
