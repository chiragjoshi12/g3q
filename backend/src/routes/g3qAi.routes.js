import { Router } from 'express';
import { chat } from '../controllers/g3qAi.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { g3qAiChatSchema } from '../validators/g3qAi.validator.js';

const router = Router();

/** POST /api/g3q-ai/chat — Gemini reply with G3Q Abhiyan system context. */
router.post('/chat', validateRequest(g3qAiChatSchema), chat);

export default router;
