import { CONFIG } from '../config/index.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

const CHAT_COMPLETIONS_URL = `${CONFIG.AI.BASE_URL}/chat/completions`;

function ensureConfigured() {
  if (!CONFIG.AI.API_KEY) {
    throw new AppError(
      ERROR_CODE.UNKNOWN,
      'G3Q AI is not configured. Set META_AI_API_KEY on the server.'
    );
  }
}

function authHeaders({ stream = false } = {}) {
  return {
    Authorization: `Bearer ${CONFIG.AI.API_KEY}`,
    'Content-Type': 'application/json',
    Accept: stream ? 'text/event-stream' : 'application/json',
  };
}

function parseApiError(status, payload) {
  const message =
    payload?.error?.message || payload?.message || `Meta AI request failed with HTTP ${status}`;
  return new AppError(ERROR_CODE.UNKNOWN, message, payload);
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw parseApiError(response.status, payload);
  return payload;
}

export async function requestMetaChatCompletion({
  messages,
  responseFormat,
  maxCompletionTokens,
  timeoutMs = CONFIG.AI.TIMEOUT_MS,
}) {
  ensureConfigured();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        model: CONFIG.AI.MODEL,
        messages,
        ...(responseFormat ? { response_format: responseFormat } : {}),
        ...(maxCompletionTokens ? { max_completion_tokens: maxCompletionTokens } : {}),
      }),
      signal: controller.signal,
    });
    return parseJsonResponse(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error?.name === 'AbortError') {
      throw new Error(`Meta AI timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function* streamMetaChatCompletion({
  messages,
  timeoutMs = CONFIG.AI.TIMEOUT_MS,
}) {
  ensureConfigured();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: authHeaders({ stream: true }),
      body: JSON.stringify({
        model: CONFIG.AI.MODEL,
        messages,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw parseApiError(response.status, payload);
    }

    if (!response.body) {
      throw new Error('Meta AI stream response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      while (buffer.includes('\n\n')) {
        const idx = buffer.indexOf('\n\n');
        const eventBlock = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        for (const line of eventBlock.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          yield JSON.parse(payload);
        }
      }
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error?.name === 'AbortError') {
      throw new Error(`Meta AI timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
