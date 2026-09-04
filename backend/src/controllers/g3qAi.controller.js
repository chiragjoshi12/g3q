import { AppError, ERROR_CODE } from '../utils/appError.js';
import { g3qAiChatService } from '../services/g3qAiChat.service.js';

const writeSse = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

/**
 * POST /api/g3q-ai/chat — SSE stream of Gemini chunks.
 * Events: { type: 'chunk', text } … { type: 'done', model, latencyMs }
 *          or { type: 'error', message }
 */
export const chat = async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    let sentChunk = false;

    try {
      for await (const event of g3qAiChatService.streamChat({ messages: req.body.messages })) {
        if (res.writableEnded) break;
        writeSse(res, event);
        if (event.type === 'chunk') sentChunk = true;
        if (typeof res.flush === 'function') res.flush();
      }
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : error?.message?.includes('timed out')
            ? 'G3Q AI is taking too long. Please try again.'
            : 'G3Q AI could not reply right now. Please try again.';

      console.error('[g3qAiChat stream]', error?.message || error);

      if (!res.writableEnded) {
        writeSse(res, {
          type: 'error',
          code: error instanceof AppError ? error.code : ERROR_CODE.UNKNOWN,
          message,
          partial: sentChunk,
        });
      }
    }

    if (!res.writableEnded) res.end();
  } catch (error) {
    // Headers not sent yet (e.g. validation already ran) — use normal error path.
    if (!res.headersSent) return next(error);
    if (!res.writableEnded) res.end();
  }
};
