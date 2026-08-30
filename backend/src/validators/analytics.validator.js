import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  from: z.string().trim().optional(), // YYYY-MM-DD
  to: z.string().trim().optional(),
  district: z.string().trim().max(128).optional(),
  taluka: z.string().trim().max(128).optional(),
  school_id: z.string().trim().max(32).optional(),
});

export const analyticsGeoQuerySchema = analyticsQuerySchema.extend({
  group_by: z.enum(['district', 'taluka', 'school']).default('district'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
