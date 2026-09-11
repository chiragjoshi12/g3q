"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authController } from "@/controllers/auth.controller";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { toMessage } from "@/lib/core/errors";
import { isCitizen, ROLE } from "@/lib/domain/roles";
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
  phone: "",
  otp: "",
  otpId: null,
  maskedPhone: "",
  pendingUser: null,
  pendingToken: null,
  needsSignup: false,
  profileFirstName: "",
  profileLastName: "",
  profileName: "",
  profileDistrict: "",
  profileTaluka: "",
  profileDistrictId: null,
  profileTalukaId: null,
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

      setPhone: (phone) =>
        set({ phone: phone.replace(/\D/g, "").slice(0, appConfig.auth.phoneLength), error: null }),

      setOtp: (otp) => set({ otp, error: null }),

      setProfileFirstName: (profileFirstName) => set({ profileFirstName, error: null }),

      setProfileLastName: (profileLastName) => set({ profileLastName, error: null }),

      setProfileName: (profileName) => set({ profileName, error: null }),

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
        const { phone } = get();
        set({ loading: true, error: null });
        try {
          const { id, maskedPhone } = await authController.sendOtp({
            role: ROLE.CITIZEN,
            credential: phone,
            phone,
          });
          set({
            loading: false,
            step: AUTH_STEP.OTP,
            welcomeSourceStep: null,
            role: ROLE.CITIZEN,
            credential: phone,
            otpId: id,
            maskedPhone,
            otp: "",
            needsSignup: false,
            pendingUser: null,
            pendingToken: null,
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** Step 1 → 2 (legacy / signup roster): validate CTS/ABC and show confirm card. */
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

      /** School/college legacy path still used after category → credential. */
      requestOtp: async () => {
        const { role, credential, phone } = get();
        const otpPhone = isCitizen(role) ? credential || phone : phone;
        set({ loading: true, error: null });
        try {
          const { id, maskedPhone } = await authController.sendOtp({
            role,
            credential,
            phone: otpPhone,
          });
          set({
            loading: false,
            step: AUTH_STEP.OTP,
            welcomeSourceStep: null,
            phone: otpPhone,
            otpId: id,
            maskedPhone,
            otp: "",
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /**
       * Verify OTP for phone-first login.
       * Existing user → confirm screen. New number → category / profile signup.
       */
      verifyOtp: async () => {
        const { otpId, otp, role, credential } = get();
        set({ loading: true, error: null });
        try {
          const result = await authController.verifyOtp({
            id: otpId,
            otp,
            role: ROLE.CITIZEN,
            credential: credential || get().phone,
          });
          if (result.needsSignup) {
            set({
              loading: false,
              otp: "",
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

      /** After category pick for new users. */
      selectSignupRole: (role) => {
        if (isCitizen(role)) {
          set({
            role,
            credential: get().phone,
            step: AUTH_STEP.PROFILE,
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

      /** Confirm roster identity and attach verified phone. */
      confirmRosterLink: async () => {
        const { otpId, role, credential } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.linkRoster({
            id: otpId,
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
          otpId,
          profileName,
          profileDistrict,
          profileTaluka,
          profileDistrictId,
          profileTalukaId,
        } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.registerCitizen({
            id: otpId,
            name: profileName,
            district: profileDistrict,
            taluka: profileTaluka,
            districtId: profileDistrictId,
            talukaId: profileTalukaId,
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

      betaLogin: async () => {
        const {
          credential,
          profileFirstName,
          profileLastName,
          profileDistrict,
          profileTaluka,
          profileDistrictId,
          profileTalukaId,
        } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.betaLogin({
            firstName: profileFirstName,
            lastName: profileLastName,
            district: profileDistrict,
            taluka: profileTaluka,
            districtId: profileDistrictId,
            talukaId: profileTalukaId,
            phone: credential,
          });
          set({
            loading: false,
            step: AUTH_STEP.WELCOME,
            welcomeSourceStep: AUTH_STEP.CREDENTIAL,
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
          otpId: null,
          needsSignup: false,
          pendingUser: null,
          pendingToken: null,
          credential: "",
          profileFirstName: "",
          profileLastName: "",
          profileName: "",
          profileDistrict: "",
          profileTaluka: "",
          profileDistrictId: null,
          profileTalukaId: null,
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
