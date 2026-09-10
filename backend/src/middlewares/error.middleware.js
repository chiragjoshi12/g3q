import { ZodError } from 'zod';
import { AppError, ERROR_CODE, ERROR_MESSAGE } from '../utils/appError.js';
import { wrapErrorBody } from '../utils/apiResponse.js';

function zodMessage(error) {
  const issue = error?.issues?.[0];
  if (!issue) return ERROR_MESSAGE[ERROR_CODE.INVALID_REQUEST];
  const path = Array.isArray(issue.path) && issue.path.length ? issue.path.join('.') : null;
  const msg = String(issue.message || '').trim() || ERROR_MESSAGE[ERROR_CODE.INVALID_REQUEST];
  return path ? `${path}: ${msg}` : msg;
}

export const notFoundHandler = (req, res) => {
  res.status(404).json(
    wrapErrorBody({
      code: ERROR_CODE.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    })
  );
};

/** Centralized error handler — always responds with { success:false, code, message }. */
export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    return res.status(error.status).json(
      wrapErrorBody({
        code: error.code,
        message: error.message,
        details: error.details,
      })
    );
  }

  if (error instanceof ZodError) {
    return res.status(400).json(
      wrapErrorBody({
        code: ERROR_CODE.INVALID_REQUEST,
        message: zodMessage(error),
        details: error.flatten(),
      })
    );
  }

  // CORS package rejects with a plain Error — surface a clear message.
  if (error?.message && String(error.message).startsWith('CORS blocked')) {
    return res.status(403).json(
      wrapErrorBody({
        code: ERROR_CODE.FORBIDDEN,
        message: error.message,
      })
    );
  }

  console.error(error);
  return res.status(500).json(
    wrapErrorBody({
      code: ERROR_CODE.UNKNOWN,
      message: ERROR_MESSAGE[ERROR_CODE.UNKNOWN],
    })
  );
};

/** Wraps an async route handler so rejected promises reach errorHandler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
