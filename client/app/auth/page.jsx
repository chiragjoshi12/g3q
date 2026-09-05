"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { CitizenProfileStep } from "@/components/auth/CitizenProfileStep";
import { CredentialStep } from "@/components/auth/CredentialStep";
import { IdentityStep } from "@/components/auth/IdentityStep";
import { OtpStep } from "@/components/auth/OtpStep";
import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/config/routes";
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
  const role = useAuthStore((state) => state.role);
  const credential = useAuthStore((state) => state.credential);
  const identity = useAuthStore((state) => state.identity);
  const phone = useAuthStore((state) => state.phone);
  const otp = useAuthStore((state) => state.otp);
  const profileName = useAuthStore((state) => state.profileName);
  const profileDistrict = useAuthStore((state) => state.profileDistrict);
  const profileTaluka = useAuthStore((state) => state.profileTaluka);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const setRole = useAuthStore((state) => state.setRole);
  const setCredential = useAuthStore((state) => state.setCredential);
  const setPhone = useAuthStore((state) => state.setPhone);
  const setOtp = useAuthStore((state) => state.setOtp);
  const setProfileName = useAuthStore((state) => state.setProfileName);
  const setProfileDistrict = useAuthStore((state) => state.setProfileDistrict);
  const setProfileTaluka = useAuthStore((state) => state.setProfileTaluka);
  const lookupIdentity = useAuthStore((state) => state.lookupIdentity);
  const requestOtp = useAuthStore((state) => state.requestOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const completeCitizenProfile = useAuthStore((state) => state.completeCitizenProfile);
  const backToCredential = useAuthStore((state) => state.backToCredential);
  const backToIdentity = useAuthStore((state) => state.backToIdentity);

  const citizen = isCitizen(role);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(ROUTES.home);
  }, [hydrated, isAuthenticated, router]);

  return (
    <AppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F3F3F3]">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#F3F3F3] md:max-w-none">
        <AuthBrandHeader />
        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-8">
          {step === AUTH_STEP.CREDENTIAL ? (
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

          {step === AUTH_STEP.IDENTITY ? (
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

          {step === AUTH_STEP.OTP ? (
            <OtpStep
              otp={otp}
              error={error}
              loading={loading}
              onOtpChange={setOtp}
              onVerify={verifyOtp}
              onBack={citizen ? backToCredential : backToIdentity}
            />
          ) : null}

          {step === AUTH_STEP.PROFILE ? (
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
      </div>
    </AppShell>
  );
}
