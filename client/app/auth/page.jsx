"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { BetaLoginStep } from "@/components/auth/BetaLoginStep";
import { CitizenProfileStep } from "@/components/auth/CitizenProfileStep";
import { CredentialStep } from "@/components/auth/CredentialStep";
import { IdentityStep } from "@/components/auth/IdentityStep";
import { OtpStep } from "@/components/auth/OtpStep";
import { WelcomeStep } from "@/components/auth/WelcomeStep";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { appConfig } from "@/config/app.config";
import { consumePostAuthPath, markLoginToast, ROUTES } from "@/config/routes";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { isCitizen } from "@/lib/domain/roles";
import { AUTH_STEP, useAuthStore } from "@/store/auth.store";

/**
 * Login flow container. All state lives in the auth store; this component only
 * routes between steps and hands callbacks down.
 *
 * School / college: CTS or ABC → identity + phone → OTP → session.
 * Citizen: mobile → OTP → name / district / taluka → session.
 */
export default function AuthPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);

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
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const setRole = useAuthStore((state) => state.setRole);
  const setCredential = useAuthStore((state) => state.setCredential);
  const setPhone = useAuthStore((state) => state.setPhone);
  const setOtp = useAuthStore((state) => state.setOtp);
  const setProfileFirstName = useAuthStore((state) => state.setProfileFirstName);
  const setProfileLastName = useAuthStore((state) => state.setProfileLastName);
  const setProfileName = useAuthStore((state) => state.setProfileName);
  const setProfileDistrict = useAuthStore((state) => state.setProfileDistrict);
  const setProfileTaluka = useAuthStore((state) => state.setProfileTaluka);
  const lookupIdentity = useAuthStore((state) => state.lookupIdentity);
  const requestOtp = useAuthStore((state) => state.requestOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const completeCitizenProfile = useAuthStore((state) => state.completeCitizenProfile);
  const betaLogin = useAuthStore((state) => state.betaLogin);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const backToCredential = useAuthStore((state) => state.backToCredential);
  const backToIdentity = useAuthStore((state) => state.backToIdentity);

  const pendingUser = useAuthStore((state) => state.pendingUser);
  const citizen = isCitizen(role);
  const visibleStep = step === AUTH_STEP.WELCOME ? welcomeSourceStep : step;

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

  return (
    <DesktopAppShell
      showSidebar={false}
      className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F3F3F3]"
    >
      <div className="flex h-full min-h-0 w-full flex-1 lg:items-center lg:justify-center lg:px-10 lg:py-8">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#F3F3F3] md:max-w-none lg:h-[min(58rem,92dvh)] lg:w-[min(42rem,90vw)] lg:max-w-[42rem] lg:overflow-hidden lg:rounded-[1.85rem] lg:bg-white lg:shadow-[0_24px_80px_rgb(15_23_42/0.12)]">
        <AuthBrandHeader />
        <main
          className={`no-scrollbar relative min-h-0 flex-1 overscroll-contain px-5 py-8 lg:px-12 lg:py-10 ${
            step === AUTH_STEP.WELCOME ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {appConfig.beta.enabled && visibleStep === AUTH_STEP.CREDENTIAL ? (
            <BetaLoginStep
              firstName={profileFirstName}
              lastName={profileLastName}
              district={profileDistrict}
              taluka={profileTaluka}
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

          {!appConfig.beta.enabled && visibleStep === AUTH_STEP.CREDENTIAL ? (
            <CredentialStep
              role={role}
              credential={credential}
              error={error}
              loading={loading}
              onRoleChange={setRole}
              onCredentialChange={setCredential}
              onSubmit={citizen ? requestOtp : lookupIdentity}
            />
          ) : null}

          {!appConfig.beta.enabled && visibleStep === AUTH_STEP.IDENTITY ? (
            <IdentityStep
              identity={identity}
              phone={phone}
              error={error}
              loading={loading}
              onPhoneChange={setPhone}
              onSubmit={requestOtp}
              onBack={backToCredential}
            />
          ) : null}

          {!appConfig.beta.enabled && visibleStep === AUTH_STEP.OTP ? (
            <OtpStep
              otp={otp}
              error={error}
              loading={loading}
              onOtpChange={setOtp}
              onVerify={verifyOtp}
              onBack={citizen ? backToCredential : backToIdentity}
            />
          ) : null}

          {!appConfig.beta.enabled && visibleStep === AUTH_STEP.PROFILE ? (
            <CitizenProfileStep
              name={profileName}
              district={profileDistrict}
              taluka={profileTaluka}
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
