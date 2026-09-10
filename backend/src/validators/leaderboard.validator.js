import { z } from 'zod';

const langSchema = z.enum(['gu', 'en', 'hi']).default('gu');

/** Leaderboard scope must be a positive taluka id (not a place name). */
const talukaIdSchema = z.coerce.number().int().positive().optional();

const weekSchema = z.coerce.number().int().min(1).max(52).optional();

export const schoolLeaderboardQuerySchema = z.object({
  school_id: z.string().trim().max(32).optional(),
  institute: z.string().trim().max(255).optional(),
  taluka: talukaIdSchema,
  week: weekSchema,
  lang: langSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const talukaLeaderboardQuerySchema = z.object({
  taluka: talukaIdSchema,
  week: weekSchema,
  lang: langSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const globalLeaderboardQuerySchema = z.object({
  taluka: talukaIdSchema,
  week: weekSchema,
  lang: langSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
