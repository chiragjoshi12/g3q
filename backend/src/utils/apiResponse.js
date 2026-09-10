/**
 * Standard API envelope for every JSON response:
 *   success → { success: true, message, ...payload | data }
 *   failure → { success: false, code, message, details? }
 */

export function defaultSuccessMessage(req, statusCode = 200) {
  if (statusCode === 201) return 'Created successfully.';
  const method = String(req?.method || 'GET').toUpperCase();
  if (method === 'DELETE') return 'Deleted successfully.';
  if (method === 'PUT' || method === 'PATCH') return 'Updated successfully.';
  if (method === 'POST') return 'Completed successfully.';
  return 'Request successful.';
}

export function wrapSuccessBody(body, req, statusCode = 200) {
  if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.success === 'boolean') {
    return body;
  }

  const message = defaultSuccessMessage(req, statusCode);

  if (Array.isArray(body) || body === null || typeof body !== 'object') {
    return {
      success: true,
      message,
      data: body,
    };
  }

  const { message: bodyMessage, success: _ignored, ...rest } = body;
  return {
    success: true,
    message: typeof bodyMessage === 'string' && bodyMessage.trim() ? bodyMessage : message,
    ...rest,
  };
}

export function wrapErrorBody({ code, message, details } = {}) {
  const payload = {
    success: false,
    code: code || 'UNKNOWN',
    message: message || 'Something went wrong. Please try again.',
  };
  if (details !== undefined && details !== null) payload.details = details;
  return payload;
}

/**
 * Patches res.json so every controller gets a consistent envelope
 * without rewriting each handler. Skips SSE streams.
 */
export function apiEnvelopeMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    const contentType = String(res.getHeader('Content-Type') || '');
    if (contentType.includes('text/event-stream')) {
      return originalJson(body);
    }

    const statusCode = res.statusCode || 200;
    if (statusCode >= 400) {
      if (body && typeof body === 'object' && body.success === false) {
        return originalJson(body);
      }
      return originalJson(
        wrapErrorBody({
          code: body?.code,
          message: body?.message,
          details: body?.details,
        })
      );
    }

    return originalJson(wrapSuccessBody(body, req, statusCode));
  };

  next();
}
