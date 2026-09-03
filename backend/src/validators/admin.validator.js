import { z } from 'zod';
import { ADMIN_ROLE, REVIEW_ACTION } from '../config/admin.roles.js';

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const adminProfileUpdateSchema = z.object({
  full_name: z.string().trim().max(128).nullable().optional(),
  university: z.string().trim().max(255).nullable().optional(),
  mobile_number: z.string().trim().max(20).nullable().optional(),
});

export const adminCreateUserSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(6).max(128),
  full_name: z.string().trim().max(128).nullable().optional(),
  university: z.string().trim().max(255).nullable().optional(),
  mobile_number: z.string().trim().max(20).nullable().optional(),
  role: z.enum([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MASTER]).optional().default(ADMIN_ROLE.ADMIN),
  daily_quota: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().min(1).max(2000).optional()
  ),
});

export const adminWorkQuotaSchema = z.object({
  admin_id: z.coerce.number().int().positive(),
  daily_quota: z.coerce.number().int().min(1).max(2000),
  is_active: z.boolean().optional().default(true),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const questionUpdateSchema = z
  .object({
    department_gu: z.string().nullable().optional(),
    department_en: z.string().nullable().optional(),
    question_gu: z.string().nullable().optional(),
    question_en: z.string().nullable().optional(),
    option_a_gu: z.string().nullable().optional(),
    option_b_gu: z.string().nullable().optional(),
    option_c_gu: z.string().nullable().optional(),
    option_d_gu: z.string().nullable().optional(),
    option_a_en: z.string().nullable().optional(),
    option_b_en: z.string().nullable().optional(),
    option_c_en: z.string().nullable().optional(),
    option_d_en: z.string().nullable().optional(),
    // Accepted for UI compat but ignored — answer text is derived from options.
    correct_answer_gu: z.string().nullable().optional(),
    correct_answer_en: z.string().nullable().optional(),
    correct_option: z.preprocess(
      (v) => {
        if (v == null || v === '') return null;
        return String(v).trim().toUpperCase();
      },
      z.enum(['A', 'B', 'C', 'D']).nullable().optional()
    ),
    scope: z.string().trim().max(32).nullable().optional(),
    district: z.string().trim().max(128).nullable().optional(),
    caste_category: z.string().trim().max(32).nullable().optional(),
  })
  .strict();

export const questionReviewSchema = z.object({
  action: z.enum([REVIEW_ACTION.ACCEPTED, REVIEW_ACTION.REJECTED]),
  note: z.string().trim().max(2000).nullable().optional(),
});

export const questionCommentSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const questionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  language: z.enum(['all', 'both', 'gu_only', 'en_only']).default('all'),
  review_status: z.enum(['all', 'PENDING', 'ACCEPTED', 'REJECTED']).default('all'),
  q: z.string().trim().optional(),
  correct_option: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[ABCD]?$/)
    .optional()
    .transform((v) => (v ? v : undefined)),
  assigned_to: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v !== '' ? v : undefined)),
});
