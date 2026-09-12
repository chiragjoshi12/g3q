import { z } from 'zod';
import { ROLE } from '../config/roles.js';

const roleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE, ROLE.CITIZEN]);
const rosterRoleSchema = z.enum([ROLE.STUDENT, ROLE.COLLEGE]);
const phoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, {
  message: 'phone must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
});

const optionalPositiveInt = z.preprocess((value) => {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}, z.number().int().positive().optional());

const optionalName = z.preprocess((value) => {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}, z.string().min(1).max(128).optional());

function refineGeography(data, ctx) {
  if (data.districtId == null && !data.district) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['districtId'],
      message: 'districtId or district is required',
    });
  }
  if (data.talukaId == null && !data.taluka) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['talukaId'],
      message: 'talukaId or taluka is required',
    });
  }
}

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

const otpRequestIdSchema = z.preprocess((value) => {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}, z.number().int().positive());

export const verifyOtpSchema = z.object({
  id: otpRequestIdSchema,
  otp: z.string().min(1),
  role: roleSchema,
  credential: z.string().optional().default(''),
});

export const registerCitizenSchema = z
  .object({
    id: otpRequestIdSchema,
    name: z.string().trim().min(1).max(128),
    districtId: optionalPositiveInt,
    talukaId: optionalPositiveInt,
    district: optionalName,
    taluka: optionalName,
  })
  .superRefine(refineGeography);

export const linkRosterSchema = z.object({
  id: otpRequestIdSchema,
  role: rosterRoleSchema,
  credential: z.string().min(1),
});
