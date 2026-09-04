import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(8000),
});

export const g3qAiChatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(24),
});
