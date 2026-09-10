"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authController } from "@/controllers/auth.controller";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { toMessage } from "@/lib/core/errors";
import { isCitizen } from "@/lib/domain/roles";
import { STORAGE_KEYS, zustandStorage } from "@/lib/storage/storage";

/** Steps of the login flow, in order. */
export const AUTH_STEP = {
  CREDENTIAL: "credential",
  IDENTITY: "identity",
  OTP: "otp",
  PROFILE: "profile",
  WELCOME: "welcome",
};

const initialFlow = {
  step: AUTH_STEP.CREDENTIAL,
  welcomeSourceStep: null,
  role: null,
  credential: "",
  identity: null,
  phone: "",
  otp: "",
  requestId: null,
  maskedPhone: "",
  pendingUser: null,
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
      // Persisted session
      user: null,
      token: null,
      isAuthenticated: false,

      // Transient login flow (not persisted)
      ...initialFlow,

      setRole: (role) =>
        set({
          role,
          welcomeSourceStep: null,
          credential: "",
          identity: null,
          phone: "",
          otp: "",
          profileFirstName: "",
          profileLastName: "",
          profileName: "",
          profileDistrict: "",
          profileTaluka: "",
          profileDistrictId: null,
          profileTalukaId: null,
          error: null,
          step: AUTH_STEP.CREDENTIAL,
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

      /** Step 1 → 2: validate the CTS Number/ABC code and resolve it to a name. */
      lookupIdentity: async () => {
        const { role, credential } = get();
        set({ loading: true, error: null });
        try {
          const identity = await authController.lookupIdentity({ role, credential });
          set({ loading: false, step: AUTH_STEP.IDENTITY, identity, phone: "" });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** School/college: identity → OTP. Citizen: mobile on step 1 → OTP. */
      requestOtp: async () => {
        const { role, credential, phone } = get();
        const otpPhone = isCitizen(role) ? credential : phone;
        set({ loading: true, error: null });
        try {
          const { requestId, maskedPhone } = await authController.sendOtp({
            role,
            credential,
            phone: otpPhone,
          });
          set({
            loading: false,
            step: AUTH_STEP.OTP,
            welcomeSourceStep: null,
            phone: otpPhone,
            requestId,
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
       * Verify the OTP. Roster users land in the session immediately.
       * New / incomplete નાગરિક accounts continue to the profile form.
       */
      verifyOtp: async () => {
        const { requestId, otp, role, credential } = get();
        set({ loading: true, error: null });
        try {
          const result = await authController.verifyOtp({
            requestId,
            otp,
            role,
            credential,
          });
          if (result.needsProfile) {
            set({
              loading: false,
              step: AUTH_STEP.PROFILE,
              otp: "",
            });
            return true;
          }
          set({
            loading: false,
            step: AUTH_STEP.WELCOME,
            welcomeSourceStep: AUTH_STEP.OTP,
            pendingUser: result.user,
            token: result.token,
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      completeCitizenProfile: async () => {
        const {
          requestId,
          profileName,
          profileDistrict,
          profileTaluka,
          profileDistrictId,
          profileTalukaId,
        } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.registerCitizen({
            requestId,
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
            token,
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** Beta: registration form → session (no OTP). */
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
            token,
          });
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** After the success pause, commit the session so Home can open. */
      completeLogin: () => {
        const { pendingUser, token } = get();
        if (!pendingUser) return false;
        set({
          ...initialFlow,
          user: pendingUser,
          token,
          isAuthenticated: true,
        });
        return true;
      },

      /** Identity / OTP / profile "change ID or number" — back to step 1. */
      backToCredential: () =>
        set({
          step: AUTH_STEP.CREDENTIAL,
          welcomeSourceStep: null,
          identity: null,
          otp: "",
          error: null,
          requestId: null,
          profileFirstName: "",
          profileLastName: "",
          profileName: "",
          profileDistrict: "",
          profileTaluka: "",
          profileDistrictId: null,
          profileTalukaId: null,
        }),

      /** OTP step's "change number" — back to step 2, keeping the resolved identity. */
      backToIdentity: () =>
        set({ step: AUTH_STEP.IDENTITY, welcomeSourceStep: null, otp: "", error: null, requestId: null }),

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
      // Only the session survives a reload — a half-finished login does not.
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
