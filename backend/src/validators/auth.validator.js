import { z } from 'zod';
import { ROLE } from '../config/roles.js';

const rosterRoleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE]);
const mobileSchema = z.string().trim().regex(/^[6-9]\d{9}$/, {
  message: 'mobile must be a valid 10-digit Indian number starting with 6, 7, 8, or 9',
});

const requiredPositiveInt = z.preprocess((value) => {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}, z.number().int().positive());

const otpTokenSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-f0-9]{10,32}$/, { message: 'otp_token is invalid' });

export const identityLookupSchema = z.object({
  role: rosterRoleSchema,
  credential: z.string().min(1),
});

export const requestOtpSchema = z.object({
  mobile: mobileSchema,
});

export const verifyOtpSchema = z.object({
  otp_token: otpTokenSchema,
  otp: z.string().min(1),
});

export const registerCitizenSchema = z
  .object({
    otp_token: otpTokenSchema,
    name: z.string().trim().min(1).max(128),
    surname: z.string().trim().min(1).max(128),
    districtId: requiredPositiveInt,
    talukaId: requiredPositiveInt,
    consentAccepted: z.boolean(),
    consentVersion: z.string().trim().min(1).max(32),
  })
  .superRefine((data, ctx) => {
    if (data.consentAccepted !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['consentAccepted'],
        message: 'consent must be accepted to sign up',
      });
    }
  });

export const linkRosterSchema = z.object({
  otp_token: otpTokenSchema,
  role: rosterRoleSchema,
  credential: z.string().min(1),
});
