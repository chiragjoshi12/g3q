import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config/index.js';
import { G3Q_SYSTEM_PROMPT } from '../data/g3qSystemPrompt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

let client = null;

const getClient = () => {
  if (!CONFIG.AI.API_KEY) {
    throw new AppError(
      ERROR_CODE.UNKNOWN,
      'G3Q AI is not configured. Set GEMINI_API_KEY on the server.'
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: CONFIG.AI.API_KEY });
  }
  return client;
};

/** Map UI history → Gemini contents (user/model turns). */
const toGeminiContents = (messages) =>
  messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '').slice(0, 8000) }],
  }));

const cleanMessages = (messages) => {
  const cleaned = (messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim())
    .slice(-24);

  if (!cleaned.length || cleaned[cleaned.length - 1].role !== 'user') {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Last message must be from the user.');
  }
  return cleaned;
};

const chunkText = (chunk) => {
  if (!chunk) return '';
  if (typeof chunk.text === 'string') return chunk.text;
  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('');
};

export const g3qAiChatService = {
  isConfigured() {
    return Boolean(CONFIG.AI.API_KEY);
  },

  /**
   * Stream Gemini tokens. Yields `{ type: 'chunk', text }` then `{ type: 'done', ... }`.
   * @param {{ messages: Array<{ role: 'user'|'assistant', content: string }> }} input
   */
  async *streamChat({ messages }) {
    if (!this.isConfigured()) {
      throw new AppError(
        ERROR_CODE.UNKNOWN,
        'G3Q AI is not configured. Set GEMINI_API_KEY on the server.'
      );
    }

    const cleaned = cleanMessages(messages);
    const ai = getClient();
    const started = Date.now();
    let full = '';

    const stream = await ai.models.generateContentStream({
      model: CONFIG.AI.MODEL,
      contents: toGeminiContents(cleaned),
      config: {
        systemInstruction: G3Q_SYSTEM_PROMPT,
        temperature: 0.6,
      },
    });

    const deadline = Date.now() + CONFIG.AI.TIMEOUT_MS;

    for await (const chunk of stream) {
      if (Date.now() > deadline) {
        throw new Error(`G3Q AI timed out after ${CONFIG.AI.TIMEOUT_MS}ms`);
      }
      const text = chunkText(chunk);
      if (!text) continue;
      full += text;
      yield { type: 'chunk', text };
    }

    if (!full.trim()) {
      throw new Error('Empty Gemini response');
    }

    yield {
      type: 'done',
      model: CONFIG.AI.MODEL,
      latencyMs: Date.now() - started,
    };
  },
};
