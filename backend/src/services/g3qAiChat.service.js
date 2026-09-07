import { CONFIG } from '../config/index.js';
import { G3Q_SYSTEM_PROMPT } from '../data/g3qSystemPrompt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { streamMetaChatCompletion } from './metaModelApi.service.js';

const cleanMessages = (messages) => {
  const cleaned = (messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim())
    .slice(-24);

  if (!cleaned.length || cleaned[cleaned.length - 1].role !== 'user') {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Last message must be from the user.');
  }
  return cleaned;
};

export const g3qAiChatService = {
  isConfigured() {
    return Boolean(CONFIG.AI.API_KEY);
  },

  /**
   * Stream Meta AI tokens. Yields `{ type: 'chunk', text }` then `{ type: 'done', ... }`.
   * @param {{ messages: Array<{ role: 'user'|'assistant', content: string }> }} input
   */
  async *streamChat({ messages }) {
    if (!this.isConfigured()) {
      throw new AppError(
        ERROR_CODE.UNKNOWN,
        'G3Q AI is not configured. Set META_AI_API_KEY on the server.'
      );
    }

    const cleaned = cleanMessages(messages);
    const started = Date.now();
    let full = '';
    const metaMessages = [
      { role: 'system', content: G3Q_SYSTEM_PROMPT },
      ...cleaned.map((message) => ({
        role: message.role,
        content: String(message.content || '').slice(0, 8000),
      })),
    ];

    for await (const chunk of streamMetaChatCompletion({ messages: metaMessages })) {
      const text = chunk?.choices?.[0]?.delta?.content || '';
      if (!text) continue;
      full += text;
      yield { type: 'chunk', text };
    }

    if (!full.trim()) {
      throw new Error('Empty Meta AI response');
    }

    yield {
      type: 'done',
      model: CONFIG.AI.MODEL,
      latencyMs: Date.now() - started,
    };
  },
};
