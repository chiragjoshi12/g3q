import { z } from 'zod';

export const startSessionSchema = z.object({
  count: z.coerce.number().int().min(1).max(50).optional(),
  language: z.enum(['gu', 'en']).optional(),
});

export const submitSessionSchema = z.object({
  answers: z.record(z.any()).default({}),
  timings: z.record(z.coerce.number()).default({}),
  startedAt: z.coerce.number().int().positive(),
});

export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(20),
});
