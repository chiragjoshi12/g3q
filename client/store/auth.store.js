"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authController } from "@/controllers/auth.controller";
import { appConfig } from "@/config/app.config";
import { markLoginToast } from "@/config/routes";
import { toMessage } from "@/lib/core/errors";
import { isCitizen, ROLE } from "@/lib/domain/roles";
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
  role: ROLE.STUDENT,
  credential: "",
  identity: null,
  phone: "",
  otp: "",
  requestId: null,
  maskedPhone: "",
  pendingUser: null,
  profileName: "",
  profileDistrict: "",
  profileTaluka: "",
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
          credential: "",
          identity: null,
          phone: "",
          otp: "",
          profileName: "",
          profileDistrict: "",
          profileTaluka: "",
          error: null,
          step: AUTH_STEP.CREDENTIAL,
        }),

      setCredential: (credential) => set({ credential, error: null }),

      setPhone: (phone) =>
        set({ phone: phone.replace(/\D/g, "").slice(0, appConfig.auth.phoneLength), error: null }),

      setOtp: (otp) => set({ otp, error: null }),

      setProfileName: (profileName) => set({ profileName, error: null }),

      setProfileDistrict: (profileDistrict) => set({ profileDistrict, error: null }),

      setProfileTaluka: (profileTaluka) => set({ profileTaluka, error: null }),

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
            ...initialFlow,
            loading: false,
            user: result.user,
            token: result.token,
            isAuthenticated: true,
          });
          markLoginToast();
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      completeCitizenProfile: async () => {
        const { requestId, profileName, profileDistrict, profileTaluka } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.registerCitizen({
            requestId,
            name: profileName,
            district: profileDistrict,
            taluka: profileTaluka,
          });
          set({
            ...initialFlow,
            loading: false,
            user,
            token,
            isAuthenticated: true,
          });
          markLoginToast();
          return true;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return false;
        }
      },

      /** Step 4: the "Start" button commits the session. */
      completeLogin: () => {
        const { pendingUser } = get();
        if (!pendingUser) return false;
        set({ user: pendingUser, isAuthenticated: true, ...initialFlow });
        return true;
      },

      /** Identity / OTP / profile "change ID or number" — back to step 1. */
      backToCredential: () =>
        set({
          step: AUTH_STEP.CREDENTIAL,
          identity: null,
          otp: "",
          error: null,
          requestId: null,
          profileName: "",
          profileDistrict: "",
          profileTaluka: "",
        }),

      /** OTP step's "change number" — back to step 2, keeping the resolved identity. */
      backToIdentity: () =>
        set({ step: AUTH_STEP.IDENTITY, otp: "", error: null, requestId: null }),

      logout: () => set({ user: null, token: null, isAuthenticated: false, ...initialFlow }),
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
    }
  )
);
