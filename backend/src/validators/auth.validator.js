import { z } from 'zod';
import { ROLE } from '../config/roles.js';

const roleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE, ROLE.CITIZEN]);
const rosterRoleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE]);
const phoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, {
  message: 'phone must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
});

export const identityLookupSchema = z.object({
  role: rosterRoleSchema,
  credential: z.string().min(1),
});

export const requestOtpSchema = z
  .object({
    role: roleSchema,
    credential: z.string().optional().default(''),
    phone: phoneSchema,
  })
  .superRefine((data, ctx) => {
    if (data.role !== ROLE.CITIZEN && !String(data.credential || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['credential'],
        message: 'credential is required',
      });
    }
  });

export const verifyOtpSchema = z.object({
  requestId: z.string().min(1),
  otp: z.string().min(1),
  role: roleSchema,
  credential: z.string().optional().default(''),
});

export const registerCitizenSchema = z.object({
  requestId: z.string().min(1),
  name: z.string().trim().min(1).max(128),
  district: z.string().trim().min(1).max(128),
  taluka: z.string().trim().min(1).max(128),
});
