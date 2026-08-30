import { z } from 'zod';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1).optional(),
  answers: z.record(z.string(), z.any()).default({}),
  timings: z.record(z.string(), z.number()).default({}),
  // Epoch ms (Date.now() on the client). Bounded to a sane window so a bad
  // value can't overflow the wall-clock-time column instead of failing
  // validation — a real quiz session is never anywhere near a day long.
  startedAt: z
    .number()
    .refine((value) => value > Date.now() - ONE_DAY_MS && value <= Date.now(), {
      message: 'startedAt must be a recent timestamp (epoch ms).',
    }),
});
