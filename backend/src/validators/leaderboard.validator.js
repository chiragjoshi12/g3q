import { z } from 'zod';

const langSchema = z.enum(['gu', 'en', 'hi']).default('gu');

export const schoolLeaderboardQuerySchema = z.object({
  school_id: z.string().trim().max(32).optional(),
  institute: z.string().trim().max(255).optional(),
  taluka: z.coerce.number().int().positive().optional(),
  lang: langSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const talukaLeaderboardQuerySchema = z.object({
  taluka: z.coerce.number().int().positive().optional(),
  lang: langSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const globalLeaderboardQuerySchema = z.object({
  taluka: z.coerce.number().int().positive().optional(),
  lang: langSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
