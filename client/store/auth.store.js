"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authController } from "@/controllers/auth.controller";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { toMessage } from "@/lib/core/errors";
import { isCitizen, ROLE, sanitizeMobileInput } from "@/lib/domain/roles";
import { STORAGE_KEYS, zustandStorage } from "@/lib/storage/storage";

/** Steps of the login flow, in order. */
export const AUTH_STEP = {
  PHONE: "phone",
  CREDENTIAL: "credential",
  CATEGORY: "category",
  IDENTITY: "identity",
  OTP: "otp",
  CONFIRM: "confirm",
  PROFILE: "profile",
  WELCOME: "welcome",
};

const initialFlow = {
  step: AUTH_STEP.PHONE,
  welcomeSourceStep: null,
  role: ROLE.CITIZEN,
  credential: "",
  identity: null,
  mobile: "",
  otp: "",
  otpToken: null,
  authCase: null,
  maskedMobile: "",
  pendingUser: null,
  pendingToken: null,
  needsSignup: false,
  profileFirstName: "",
  profileLastName: "",
  profileName: "",
  profileSurname: "",
  profileDistrict: "",
  profileTaluka: "",
  profileDistrictId: null,
  profileTalukaId: null,
  consentAccepted: false,
  loading: false,
  error: null,
};

export const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      ...initialFlow,

      setRole: (role) =>
        set({
          role,
          welcomeSourceStep: null,
          credential: "",
          identity: null,
          error: null,
        }),

      setCredential: (credential) => set({ credential, error: null }),

      setMobile: (mobile) => set({ mobile: sanitizeMobileInput(mobile), error: null }),

      setOtp: (otp) => set({ otp, error: null }),

      setProfileFirstName: (profileFirstName) => set({ profileFirstName, error: null }),

      setProfileLastName: (profileLastName) => set({ profileLastName, error: null }),

      setProfileName: (profileName) => set({ profileName, error: null }),

      setProfileSurname: (profileSurname) => set({ profileSurname, error: null }),

      setConsentAccepted: (consentAccepted) => set({ consentAccepted: Boolean(consentAccepted), error: null }),

      setProfileDistrict: (profileDistrict, profileDistrictId = null) =>
        set({
          profileDistrict,
          profileDistrictId:
            profileDistrictId != null && profileDistrictId !== ""
              ? Number(profileDistrictId)
              : null,
          profileTaluka: "",
          profileTalukaId: null,
          error: null,
        }),

      setProfileTaluka: (profileTaluka, profileTalukaId = null) =>
        set({
          profileTaluka,
          profileTalukaId:
            profileTalukaId != null && profileTalukaId !== ""
              ? Number(profileTalukaId)
              : null,
          error: null,
        }),

      clearError: () => set({ error: null }),

      /** Production step 1: send OTP to the entered mobile number. */
      requestPhoneOtp: async () => {
        const { mobile } = get();
        set({ loading: true, error: null });
        try {
          const { otp_token, maskedMobile, case: authCase } = await authController.sendOtp({
            mobile,
          });
          set({
            loading: false,
            step: AUTH_STEP.OTP,
            welcomeSourceStep: null,
            role: ROLE.CITIZEN,
            credential: mobile,
            otpToken: otp_token,
            authCase: authCase || null,
            maskedMobile,
            otp: "",
            needsSignup: authCase === "signup",
            pendingUser: null,
            pendingToken: null,
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** Step 1 → 2 (legacy / signup roster): validate CTS/Appar and show confirm card. */
      lookupIdentity: async () => {
        const { role, credential } = get();
        set({ loading: true, error: null });
        try {
          const identity = await authController.lookupIdentity({ role, credential });
          set({ loading: false, step: AUTH_STEP.IDENTITY, identity });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** Resend OTP for the same mobile (mobile-only API). */
      requestOtp: async () => {
        const { mobile } = get();
        set({ loading: true, error: null });
        try {
          const { otp_token, maskedMobile, case: authCase } = await authController.sendOtp({
            mobile,
          });
          set({
            loading: false,
            step: AUTH_STEP.OTP,
            welcomeSourceStep: null,
            otpToken: otp_token,
            authCase: authCase || null,
            maskedMobile,
            otp: "",
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /**
       * Verify OTP for mobile-first login.
       * Existing user → confirm screen. New number → category / profile signup.
       */
      verifyOtp: async () => {
        const { otpToken, otp } = get();
        set({ loading: true, error: null });
        try {
          const result = await authController.verifyOtp({
            otp_token: otpToken,
            otp,
          });
          if (result.needsSignup) {
            set({
              loading: false,
              otp: "",
              otpToken: result.otp_token || otpToken,
              needsSignup: true,
              step: result.needsProfile ? AUTH_STEP.PROFILE : AUTH_STEP.CATEGORY,
              role: result.needsProfile ? ROLE.CITIZEN : null,
            });
            return true;
          }
          set({
            loading: false,
            step: AUTH_STEP.CONFIRM,
            welcomeSourceStep: AUTH_STEP.OTP,
            pendingUser: result.user,
            pendingToken: result.token,
            token: result.token,
            otp: "",
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** Existing-user confirm screen → enter the app. */
      confirmExistingUser: () => {
        const { pendingUser, pendingToken, token } = get();
        if (!pendingUser) return false;
        set({
          ...initialFlow,
          user: pendingUser,
          token: pendingToken || token,
          isAuthenticated: true,
        });
        return true;
      },

      /** After category pick for new users. Citizen stays here until Next. */
      selectSignupRole: (role) => {
        if (isCitizen(role)) {
          set({
            role,
            credential: get().mobile,
            step: AUTH_STEP.CATEGORY,
            error: null,
          });
          return;
        }
        set({
          role,
          credential: "",
          identity: null,
          step: AUTH_STEP.CREDENTIAL,
          error: null,
        });
      },

      /** Citizen chose Next on the category screen → name / place form. */
      continueCitizenSignup: () => {
        set({
          role: ROLE.CITIZEN,
          credential: get().mobile,
          step: AUTH_STEP.PROFILE,
          error: null,
        });
      },

      /** Confirm roster identity and attach verified mobile. */
      confirmRosterLink: async () => {
        const { otpToken, role, credential } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.linkRoster({
            otp_token: otpToken,
            role,
            credential,
          });
          set({
            loading: false,
            step: AUTH_STEP.WELCOME,
            welcomeSourceStep: AUTH_STEP.IDENTITY,
            pendingUser: user,
            pendingToken: token,
            token,
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      completeCitizenProfile: async () => {
        const {
          otpToken,
          profileName,
          profileSurname,
          profileDistrictId,
          profileTalukaId,
          consentAccepted,
        } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.registerCitizen({
            otp_token: otpToken,
            name: profileName,
            surname: profileSurname,
            districtId: profileDistrictId,
            talukaId: profileTalukaId,
            consentAccepted,
            consentVersion: appConfig.auth.consentVersion,
          });
          set({
            loading: false,
            step: AUTH_STEP.WELCOME,
            welcomeSourceStep: AUTH_STEP.PROFILE,
            pendingUser: user,
            pendingToken: token,
            token,
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      completeLogin: () => {
        const { pendingUser, pendingToken, token } = get();
        if (!pendingUser) return false;
        set({
          ...initialFlow,
          user: pendingUser,
          token: pendingToken || token,
          isAuthenticated: true,
        });
        return true;
      },

      backToPhone: () =>
        set({
          step: AUTH_STEP.PHONE,
          welcomeSourceStep: null,
          role: ROLE.CITIZEN,
          identity: null,
          otp: "",
          error: null,
          otpToken: null,
          authCase: null,
          needsSignup: false,
          pendingUser: null,
          pendingToken: null,
          credential: "",
          profileFirstName: "",
          profileLastName: "",
          profileName: "",
          profileSurname: "",
          profileDistrict: "",
          profileTaluka: "",
          profileDistrictId: null,
          profileTalukaId: null,
          consentAccepted: false,
        }),

      backToCategory: () =>
        set({
          step: AUTH_STEP.CATEGORY,
          welcomeSourceStep: null,
          role: null,
          credential: "",
          identity: null,
          error: null,
        }),

      backToCredential: () =>
        set({
          step: get().needsSignup ? AUTH_STEP.CREDENTIAL : AUTH_STEP.PHONE,
          welcomeSourceStep: null,
          identity: null,
          otp: "",
          error: null,
        }),

      backToIdentity: () =>
        set({ step: AUTH_STEP.IDENTITY, welcomeSourceStep: null, otp: "", error: null }),

      logout: () => set({ user: null, token: null, isAuthenticated: false, ...initialFlow }),

      patchUser: (partial) => {
        const current = get().user;
        if (!current || !partial) return;
        set({ user: { ...current, ...partial } });
      },
    }),
    {
      name: STORAGE_KEYS.session,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (
          appConfig.dataSource === DATA_SOURCE.REST &&
          typeof state?.token === "string" &&
          state.token.startsWith("static.")
        ) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);
