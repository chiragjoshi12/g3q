"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authController } from "@/controllers/auth.controller";
import { appConfig } from "@/config/app.config";
import { markLoginToast } from "@/config/routes";
import { toMessage } from "@/lib/core/errors";
import { ROLE } from "@/lib/domain/roles";
import { STORAGE_KEYS, zustandStorage } from "@/lib/storage/storage";

/** Steps of the login flow, in order. */
export const AUTH_STEP = {
  CREDENTIAL: "credential",
  IDENTITY: "identity",
  OTP: "otp",
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
          error: null,
          step: AUTH_STEP.CREDENTIAL,
        }),

      setCredential: (credential) => set({ credential, error: null }),

      setPhone: (phone) =>
        set({ phone: phone.replace(/\D/g, "").slice(0, appConfig.auth.phoneLength), error: null }),

      setOtp: (otp) => set({ otp, error: null }),

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

      /** Step 2 → 3: send an OTP to the phone number just entered. */
      requestOtp: async () => {
        const { role, credential, phone } = get();
        set({ loading: true, error: null });
        try {
          const { requestId, maskedPhone } = await authController.sendOtp({
            role,
            credential,
            phone,
          });
          set({
            loading: false,
            step: AUTH_STEP.OTP,
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

      /** Step 3 → 4: verify the OTP and reveal the user's name. */
      verifyOtp: async () => {
        const { requestId, otp, role, credential } = get();
        set({ loading: true, error: null });
        try {
          const { user, token } = await authController.verifyOtp({
            requestId,
            otp,
            role,
            credential,
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

      /** Identity step's "change ID" — back to step 1. */
      backToCredential: () =>
        set({
          step: AUTH_STEP.CREDENTIAL,
          identity: null,
          phone: "",
          otp: "",
          error: null,
          requestId: null,
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
