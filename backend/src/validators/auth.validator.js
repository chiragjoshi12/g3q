import { z } from 'zod';
import { ROLE } from '../config/roles.js';

const roleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE]);

export const identityLookupSchema = z.object({
  role: roleSchema,
  credential: z.string().min(1),
});

export const requestOtpSchema = z.object({
  role: roleSchema,
  credential: z.string().min(1),
  phone: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  requestId: z.string().min(1),
  otp: z.string().min(1),
  role: roleSchema,
  credential: z.string().min(1),
});
