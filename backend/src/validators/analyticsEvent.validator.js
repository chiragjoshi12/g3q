import { z } from 'zod';

const VISITOR_KEY_RE = /^[A-Za-z0-9]{8,24}$/;

export const analyticsEventSchema = z.object({
  eventType: z.enum([
    'certificate_download',
    'g3q_ai_query',
    'practice_quiz_start',
    'practice_quiz_complete',
  ]),
  visitorKey: z.string().trim().regex(VISITOR_KEY_RE).optional(),
  occurredAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
