import { z } from 'zod';

export const schoolLeaderboardQuerySchema = z.object({
  school_id: z.string().trim().max(32).optional(),
  institute: z.string().trim().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const talukaLeaderboardQuerySchema = z.object({
  taluka: z.string().trim().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
