import { z } from 'zod';
import { ROLE } from '../config/roles.js';

const roleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE, ROLE.CITIZEN]);
const rosterRoleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE]);

export const identityLookupSchema = z.object({
  role: rosterRoleSchema,
  credential: z.string().min(1),
});

export const requestOtpSchema = z
  .object({
    role: roleSchema,
    credential: z.string().optional().default(''),
    phone: z.string().min(1),
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
