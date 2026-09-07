import { z } from 'zod';

const ID_RE = /^[A-Za-z0-9._:-]{8,64}$/;

export const analyticsEventSchema = z.object({
  eventId: z.string().trim().regex(ID_RE).max(64),
  eventType: z.enum([
    'certificate_download',
    'g3q_ai_query',
    'practice_quiz_start',
    'practice_quiz_complete',
  ]),
  visitorKey: z.string().trim().regex(ID_RE).max(64).optional(),
  occurredAt: z.coerce.date().optional(),
  role: z.enum(['student', 'college', 'citizen']).optional(),
  district: z.string().trim().max(128).optional(),
  taluka: z.string().trim().max(128).optional(),
  quizId: z.string().trim().max(64).optional(),
  sessionId: z.string().trim().max(64).optional(),
  attemptId: z.string().trim().max(64).optional(),
  questionCount: z.coerce.number().int().min(0).max(1000).optional(),
  success: z.boolean().optional(),
  latencyMs: z.coerce.number().int().min(0).max(600000).optional(),
  source: z.string().trim().max(64).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
